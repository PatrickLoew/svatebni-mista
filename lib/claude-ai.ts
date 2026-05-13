/**
 * Claude AI engine — vyhodnocuje svatební místa jako specialista (Mončin styl).
 *
 * Postup:
 *   1. Dostane VŠECHNA místa z DB (cca 200) + odpovědi klienta.
 *   2. Vybere 5 nejlepších míst dle pravidel v wedding-evaluation-rules.md.
 *   3. Pokud nesedí 5 perfektně, část označí jako "isAlternative: true" (typicky VIP z kraje).
 *   4. Vrátí persona summary + popisy v Mončině stylu.
 *
 * Optimalizace nákladů:
 *   - Prompt caching na system prompt + venues blok (TTL 5 min).
 *   - Cca 0,80 Kč první dotaz, ~0,10 Kč při cache hit.
 *
 * Fallback: pokud Claude selže, vrátí null → /api/match použije algoritmus.
 */
import Anthropic from "@anthropic-ai/sdk"
import type { Venue } from "./types"
import type { WizardAnswers } from "./matching"

const MODEL = "claude-haiku-4-5"

interface ClaudeMatch {
  slug: string
  personalDescription: string
  isAlternative: boolean
}

export interface ClaudeResult {
  personaSummary: string
  selectedMatches: ClaudeMatch[]
  cashbackText?: string
  signature?: string
}

/* ─────────── SYSTEM PROMPT (cacheable) ─────────── */

const SYSTEM_PROMPT = `Jsi specialista na svatební místa "Svatební Místa.cz". Tvým úkolem je vybrat 5 nejlepších míst pro klienta a napsat osobní doporučení v autentickém stylu Monči (majitelka služby). Pravidla:

## METRIKA (priorita shora dolů)

### A) MUST-HAVE (vylučující kritéria pro hlavní doporučení):
1. Kapacita ≥ počet hostů × 0.85 (mírně větší OK, menší ne).
2. Lokalita — pokud klient zadal kraj/město, musí to sedět.
3. Rozpočet pronájmu (priceFrom) ≤ rozpočet klienta × 1.20 (přesah max +20 %).

### B) SOFT kritéria:
4. Architektonický typ sedí klientovi (priroda/mlyn/zamek/hotel/industrial/unikat).
5. Catering policy (own_free, own_drinks_free, only_venue, negotiable).
6. Night party policy (no_curfew pro velkou party, quiet_hours pro pohodu do 22).
7. Ubytování přímo na místě (accommodationCapacity > 0), pokud klient chce.
8. VIP status (isFeatured: true) — preferuj 2 VIP z klientova kraje, pokud existují.

### C) SPECIÁLNÍ POŽADAVKY KLIENTA — pečlivě prohledej features + description:
- Pejsek/psi → features/description s "pet", "pejsek", "psi", "psy"
- Děti/hřiště → features/description s "děti", "dětsk", "hřiště", "koutek"
- Wellness/bazén → features/description s "wellness", "bazén", "sauna", "spa"
- Bezbariérovost → "bezbariér"
- Obřad u vody → features/description s "rybník", "voda", "jezero", "u vody"

→ Pokud klient explicitně zmíní speciální požadavek, alespoň 3 z 5 doporučených míst by ho měla splňovat. Pokud to v DB není možné, v persona summary uznej, že detail doladíte individuálně.

## STYL PSANÍ (DODRŽUJ DOSLOVA — toto je Mončin reálný styl)

### Persona summary (1 odstavec, 3-5 vět):
Začíná: "Podle Vašich představ hledáte svatební místo…"
Reflektuje kraj, hosty, typ, způsob svatby, catering, party.
Speciální požadavky: "Velkým plusem je pro Vás také ___"
Tón: vřelý, profesionální, vykání ("Vy/Váš"). Bez AI klišé.

### Český vokativ (5. pád) — POVINNĚ:
Pokud kdekoliv oslovuješ klienta jménem, používej VOKATIV (5. pád):
- Petr → Petře, Pavel → Pavle, Karel → Karle, Václav → Václave, Tomáš → Tomáši
- Lukáš → Lukáši, Marek → Marku, Adam → Adame, Jakub → Jakube, Filip → Filipe, Jan → Jane
- Honza → Honzo, Jirka → Jirko, Jiří → Jiří, Dominik → Dominiku
- Monika → Moniko, Jana → Jano, Anna → Anno, Petra → Petro, Eva → Evo, Lucie → Lucie

### Popis každého místa (1-2 věty):
Varíruj tyto fráze:
- "Krásné místo s jedinečnou atmosférou…"
- "Velmi příjemné místo pro pohodovou…"
- "Za mě jedno z nejlepších míst pro…"
- "Velkou výhodou je…"
- "Skvěle sedí na svatbu s/v…"
- "Ideální pro páry, které…"
- "Oblíbené místo pro…"
- "Velmi dobře funguje pro…"

### Alternativní popis (isAlternative: true):
Použij fráze:
- "Pokud by se Vám líbila varianta…"
- "Stojí za zvážení, pokud…"
- "Může být lehce nad rozpočet, ale stojí za zvážení."
- "Pokud Vás láká [styl], tohle místo by Vás mohlo bavit."

### VIP místa (isFeatured):
- "Za mě jedno z nejdoporučovanějších míst v naší selekci."
- "Naše top doporučení."
- "Jedno z nejoblíbenějších míst."

## VÝSTUPNÍ FORMÁT
Vrátíš JEN čistý JSON (žádný markdown, žádný text před/po):

{
  "personaSummary": "Podle Vašich představ hledáte svatební místo …",
  "selectedMatches": [
    {
      "slug": "presny-slug-z-db",
      "personalDescription": "1-2 věty v Mončině stylu",
      "isAlternative": false
    }
  ],
  "cashbackText": "Pokud si nakonec vyberete některé z míst, která jsme Vám doporučili, a dáte nám vědět, můžeme Vám u vybraných míst zajistit i cashback ve výši 1 000 až 10 000 Kč.",
  "signature": "Mějte se krásně"
}

## PRAVIDLA selectedMatches
- VŽDY právě 5 míst.
- Pořadí: nejprve isAlternative=false (perfektní), pak isAlternative=true (alternativy).
- Alternativa = nesplňuje 100 % kritérií, ale rozumný doplněk. Důvod uveď v popisu.
- Pokud nemáš 5 perfektních → doplň alternativy ideálně z VIP míst klientova kraje.
- ŽÁDNÉ duplicity. ŽÁDNÉ slugy, které nejsou v seznamu míst.
- Pouze platné slugy z DB.`

/* ─────────── HELPERY pro mapování klienta + venues ─────────── */

function describeClient(a: WizardAnswers): string {
  const seasonMap: Record<string, string> = {
    leto: "léto (červen–srpen)",
    podzim: "podzim (září–listopad)",
    jaro: "jaro (duben–květen)",
    jedno: "kdykoliv",
    jine: "jiný termín",
  }
  const cateringMap: Record<string, string> = {
    "vlastni-vse": "vlastní jídlo i pití bez poplatků",
    "vlastni-piti": "vlastní pití bez poplatků",
    "vse-od-mista": "vše chce od místa",
    "jedno": "je nám to jedno",
  }
  const partyMap: Record<string, string> = {
    "velka-bez-klidu": "velká party bez nočního klidu",
    "pohoda": "pohodová party (nejsou pařící typy)",
    "do-22": "jen do 22:00, pak spát",
    "jedno": "je nám to jedno",
  }
  const archMap: Record<string, string> = {
    priroda: "v přírodě (louka, les, u vody)",
    unikat: "zajímavé místo / unikát",
    hotelovy: "hotelový styl",
    mlyn: "mlýn, stodola nebo statek",
    industrial: "industriální (hala, továrna, loft)",
    hrad: "hrad",
    zamek: "zámek",
    jedno: "typ je jedno",
  }
  const accomMap: Record<string, string> = {
    primo: "přímo v místě",
    okoli: "v okolí do 10 minut",
    neni: "nepotřebujeme",
    jine: "jiné",
  }
  const modeMap: Record<string, string> = {
    "komplet": "komplet vše na jednom místě (obřad, hostina, ubytování, party)",
    "obrad-hostina": "obřad + hostina",
    "obrad-party": "obřad + party",
    "obrad": "jen obřad",
    "jine": "jiné",
  }

  return `KLIENT:
- Jméno: ${a.name || "neuvedeno"}
- Termín: ${seasonMap[a.season] ?? "—"} ${a.weddingYear || ""}
- Hostů: ${a.guests}
- Lokalita do 90 min od: ${a.nearestCity || "neuvedeno"}
- Preferované kraje: ${a.regions.join(", ") || "—"}
- Architektonický typ: ${archMap[a.archType] ?? "—"}
- Ubytování: ${accomMap[a.accommodation] ?? "—"}
- Způsob svatby: ${modeMap[a.weddingMode] ?? "—"}
- Catering/pití: ${cateringMap[a.catering] ?? "—"}
- Party: ${partyMap[a.party] ?? "—"}
- Rozpočet pronájmu: ${a.rentalBudget ? `do ${a.rentalBudget.toLocaleString("cs-CZ")} Kč` : "—"}
- Celkový rozpočet svatby: ${a.weddingBudget ? `do ${a.weddingBudget.toLocaleString("cs-CZ")} Kč` : "—"}
- Speciální požadavky (ČTI POZORNĚ!): ${a.specialRequests || "—"}`
}

function describeVenue(v: Venue, i: number): string {
  const features = (v.features ?? []).join(", ")
  const description = (v.description ?? "").substring(0, 300) // limit pro úsporu tokenů
  const vip = v.isFeatured ? " [VIP-DOPORUČUJEME]" : ""
  return `${i + 1}. ${v.title}${vip}
   slug: ${v.slug}
   lokalita: ${v.location} | kraj: ${v.region} | nejbližší město: ${v.nearestCity ?? "—"}
   typ: ${v.type} | kapacita: ${v.capacity} | pronájem od: ${v.priceFrom.toLocaleString("cs-CZ")} Kč
   catering: ${v.cateringPolicy ?? "—"} | noční klid: ${v.nightPartyPolicy ?? "—"}
   ubytování na místě: ${v.accommodationCapacity ?? 0} lůžek
   features: ${features || "—"}
   popis: ${description || "—"}`
}

/* ─────────── HLAVNÍ FUNKCE ─────────── */

export async function evaluateWithClaude(
  answers: WizardAnswers,
  venues: Venue[],
): Promise<ClaudeResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.log("[Claude] ANTHROPIC_API_KEY chybí — fallback na algoritmus")
    return null
  }
  if (venues.length === 0) {
    console.log("[Claude] Žádná místa k vyhodnocení")
    return null
  }

  const client = new Anthropic({ apiKey })

  // Sestavení promptu — venues blok je cacheable (mění se málokdy)
  const venuesBlock = venues.map(describeVenue).join("\n\n")
  const clientBlock = describeClient(answers)

  try {
    const start = Date.now()
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 3000,
      system: [
        // System prompt — cacheovaný (mění se jen při update pravidel)
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
        // Venues seznam — cacheovaný (mění se málokdy)
        {
          type: "text",
          text: `SEZNAM VŠECH SVATEBNÍCH MÍST V DATABÁZI (${venues.length}):\n\n${venuesBlock}`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `${clientBlock}\n\nVyber 5 nejlepších míst pro tohoto klienta a vrať JSON dle pravidel. Pamatuj: ŽÁDNÉ slugy mimo seznam, vždy přesně 5 míst, alternativy označ isAlternative: true.`,
        },
      ],
    })

    const elapsed = Date.now() - start
    const usage = response.usage
    console.log(
      `[Claude] Vyhodnocení OK za ${elapsed}ms — input: ${usage.input_tokens}, output: ${usage.output_tokens}, cached: ${usage.cache_read_input_tokens ?? 0}`,
    )

    // Extrahuj text
    const textBlock = response.content.find((b) => b.type === "text")
    if (!textBlock || textBlock.type !== "text") {
      console.error("[Claude] Neočekávaný formát odpovědi")
      return null
    }

    // Najdi JSON (Claude občas obalí v markdown nebo přidá text)
    let jsonText = textBlock.text.trim()
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (jsonMatch) jsonText = jsonMatch[0]

    const parsed = JSON.parse(jsonText) as ClaudeResult

    // Validace — všechny slugy musí existovat v DB
    const validSlugs = new Set(venues.map((v) => v.slug))
    const filteredMatches = (parsed.selectedMatches ?? []).filter((m) => validSlugs.has(m.slug))

    if (filteredMatches.length < parsed.selectedMatches?.length) {
      console.warn(
        `[Claude] Vyfiltrováno ${parsed.selectedMatches.length - filteredMatches.length} neplatných slugů`,
      )
    }

    return {
      ...parsed,
      selectedMatches: filteredMatches,
    }
  } catch (e) {
    console.error("[Claude] Chyba:", e instanceof Error ? e.message : e)
    return null
  }
}
