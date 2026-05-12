/**
 * Claude AI engine pro vyhodnocování svatebních míst.
 *
 * Funkce: Vygeneruje personalizovaný popis (Monca styl) pro každé doporučené místo
 * + persona summary klienta. Vše na základě reálných případových studií Monči.
 *
 * Cena: ~0,25 Kč za poptávku (Claude Haiku 4.5).
 * Fallback: Pokud Claude selže nebo není API klíč, použije algoritmus.
 */
import Anthropic from "@anthropic-ai/sdk"
import type { Venue } from "./types"
import type { WizardAnswers } from "./matching"

const MODEL = "claude-haiku-4-5"

interface ClaudeMatch {
  slug: string
  personalDescription: string  // 1-2 věty proč toto místo pro klienta
}

export interface ClaudeResult {
  personaSummary: string   // „Podle vašich představ hledáte…"
  matches: ClaudeMatch[]   // Personalizované popisy
  cashbackText?: string    // Cashback nabídka
  signature?: string       // „Mějte se krásně"
}

const SYSTEM_PROMPT = `Jsi specialista na svatební místa, který píše osobní doporučení klientům. Tvůj styl:

— TONALITA: Vykáme klientovi, používáme „Vy/Váš". Tón je vřelý, profesionální, autentický. Žádné AI klišé.
— STRUKTURA: Pro každé doporučené místo napíšeš 1-2 věty proč právě toto sedí KONKRÉTNĚ ke klientovi (na základě jeho odpovědí).
— STYL OPISU PODLE MONCI:
  • „Krásné místo s jedinečnou atmosférou…"
  • „Ideální pro páry, které chtějí…"
  • „Velkou výhodou je…"
  • „Skvěle sedí na svatbu s/v…"
  • „Za nás jedno z nejlepších míst pro…"
— JAZYK: Čeština, perfektní gramatika, žádné překlepy.
— OUTPUT FORMAT: JSON s polem 'personaSummary', 'matches' (array), 'cashbackText', 'signature'.

Vrátíš JEN platný JSON, nic jiného.`

function buildUserPrompt(answers: WizardAnswers, venues: Venue[]): string {
  const seasonMap: Record<string, string> = {
    leto: "léto (červen–srpen)",
    podzim: "podzim (září–listopad)",
    jaro: "jaro (duben–květen)",
    jedno: "kdykoliv",
    jine: "jiný termín",
  }

  const cateringMap: Record<string, string> = {
    "vlastni-vse": "chceme mít vlastní jídlo i pití bez poplatků",
    "vlastni-piti": "chceme mít vlastní pití bez poplatků",
    "vse-od-mista": "vše chceme zajistit od místa",
    "jedno": "je nám to jedno",
  }

  const partyMap: Record<string, string> = {
    "velka-bez-klidu": "chceme velkou párty bez nočního klidu",
    "pohoda": "chceme pohodovou párty (nejsme pařící typy)",
    "do-22": "jen do 22:00 a pak spát",
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
    jedno: "je nám to jedno",
  }

  const accomMap: Record<string, string> = {
    primo: "ubytování přímo v místě",
    okoli: "ubytování v okolí do 10 minut stačí",
    neni: "ubytování nepotřebujeme",
  }

  // Sestavení venues bloku
  const venuesText = venues.map((v, i) => {
    const features = (v.features ?? []).slice(0, 4).join(", ")
    return `${i + 1}. ${v.title} [slug: ${v.slug}] ${v.isFeatured ? "[VIP DOPORUČUJEME]" : ""}
   - Lokalita: ${v.location}
   - Typ: ${v.type}, kapacita do ${v.capacity} hostů
   - Pronájem od ${v.priceFrom.toLocaleString("cs-CZ")} Kč
   - Catering: ${v.cateringPolicy ?? "—"}
   - Party: ${v.nightPartyPolicy ?? "—"}
   - Vlastnosti: ${features || "—"}`
  }).join("\n\n")

  return `Klient:
- Jméno: ${answers.name || "neuvedeno"}
- Termín svatby: ${seasonMap[answers.season] ?? "—"} ${answers.weddingYear || ""}
- Počet hostů: ${answers.guests}
- Lokalita do 90 min od: ${answers.nearestCity || "neuvedeno"}
- Preferované kraje: ${answers.regions.join(", ") || "neuvedeno"}
- Typ místa: ${archMap[answers.archType] ?? "—"}
- Ubytování: ${accomMap[answers.accommodation] ?? "—"}
- Catering/pití: ${cateringMap[answers.catering] ?? "—"}
- Párty: ${partyMap[answers.party] ?? "—"}
- Rozpočet pronájmu: ${answers.rentalBudget ? `do ${answers.rentalBudget.toLocaleString("cs-CZ")} Kč` : "—"}
- Speciální požadavky: ${answers.specialRequests || "—"}

Místa k personalizaci (vrať jejich slugy v JSON outputu):
${venuesText}

Vrať čistý JSON ve formátu:
{
  "personaSummary": "Podle Vašich představ hledáte ... (3-4 věty shrnující co klient chce)",
  "matches": [
    { "slug": "slug-mista", "personalDescription": "1-2 věty proč toto místo sedí klientovi" }
  ],
  "cashbackText": "Pokud si nakonec vyberete některé z míst, můžeme Vám zajistit cashback ve výši 1 000 až 10 000 Kč.",
  "signature": "Mějte se krásně"
}

DŮLEŽITÉ:
- VIP místo zmínit jako „za nás jedno z nejdoporučovanějších" / „naše top doporučení"
- Každý popis musí být UNIKÁTNÍ — žádné šablony
- Reflektuj konkrétní preference klienta v každém popisu`
}

export async function evaluateWithClaude(
  answers: WizardAnswers,
  venues: Venue[]
): Promise<ClaudeResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.log("[Claude] ANTHROPIC_API_KEY není nastavený, používám algoritmus")
    return null
  }
  if (venues.length === 0) return null

  try {
    const client = new Anthropic({ apiKey })

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(answers, venues) }],
    })

    // Extrahuj text z odpovědi
    const textBlock = response.content.find((b) => b.type === "text")
    if (!textBlock || textBlock.type !== "text") {
      console.error("[Claude] Neočekávaný formát odpovědi")
      return null
    }

    // Najdi JSON v textu (Claude někdy obalí v markdownu)
    let jsonText = textBlock.text.trim()
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (jsonMatch) jsonText = jsonMatch[0]

    const parsed = JSON.parse(jsonText) as ClaudeResult
    console.log(`[Claude] Vyhodnocení OK — ${parsed.matches?.length || 0} popisů`)
    return parsed
  } catch (e) {
    console.error("[Claude] Chyba:", e instanceof Error ? e.message : e)
    return null
  }
}
