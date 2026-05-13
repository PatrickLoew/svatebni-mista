/**
 * KOMPLETNÍ verifikace všech polí pomocí Claude Sonnet 4.5.
 *
 * Rozšíření verify-all-venues:
 *  - Kontroluje navíc: catering_policy, night_party_policy, features
 *  - Zachovává opravy provedené přes fix-region-stablovice
 *  - Přeskakuje "VIP s manuálně potvrzenými daty" (ty se v DB poznají
 *    tím, že už mají správné hodnoty)
 *
 * Použití: npm run verify-all-fields
 */
import fs from "fs"
import path from "path"
import { createClient } from "@supabase/supabase-js"
import Anthropic from "@anthropic-ai/sdk"

const envPath = path.join(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf-8").split("\n").forEach((line) => {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m) process.env[m[1]] = m[2].trim()
  })
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const VALID_REGIONS = [
  "Praha", "Středočeský", "Jihočeský", "Plzeňský", "Karlovarský",
  "Ústecký", "Liberecký", "Královéhradecký", "Pardubický", "Vysočina",
  "Jihomoravský", "Olomoucký", "Zlínský", "Moravskoslezský", "Slovensko",
]
const VALID_CITIES = [
  "Praha", "Brno", "České Budějovice", "Plzeň",
  "Hradec Králové", "Ostrava", "Olomouc", "Liberec",
]
const VALID_TYPES = [
  "Zámek", "Hotel", "Vinný sklep", "Venkovský statek",
  "Moderní prostor", "Pláž / Příroda", "Historická budova",
]
const VALID_CATERING = ["own_free", "own_drinks_free", "only_venue", "negotiable"]
const VALID_PARTY = ["no_curfew", "indoor_after_22", "quiet_hours", "negotiable"]

interface VenueRow {
  id: string
  title: string
  description: string | null
  location: string | null
  region: string
  type: string
  nearest_city: string | null
  features: string[] | null
  website_url: string | null
  catering_policy: string | null
  night_party_policy: string | null
  is_featured: boolean
}

interface VerifiedData {
  region: string
  type: string
  nearest_city: string
  catering_policy: string
  night_party_policy: string
  features: string[]
  confidence: "high" | "medium" | "low"
  reason: string
}

async function verifyVenue(v: VenueRow): Promise<VerifiedData | null> {
  const prompt = `Ověř kompletní data svatebního místa v ČR. Vrátíš JEN platný JSON.

MÍSTO:
- Název: ${v.title}
- Aktuální kraj: ${v.region}
- Aktuální typ: ${v.type}
- Aktuální nejbližší město: ${v.nearest_city ?? "—"}
- Catering policy: ${v.catering_policy ?? "—"}
- Party policy: ${v.night_party_policy ?? "—"}
- Lokalita: ${v.location ?? "—"}
- Website: ${v.website_url ?? "—"}
- Popis: ${(v.description ?? "").substring(0, 500)}
- Features: ${(v.features ?? []).slice(0, 8).join(", ")}

ÚKOL — VRAŤ OVĚŘENÁ DATA:

1. REGION (kraj ČR)
   Povolené: ${VALID_REGIONS.join(" | ")}

   ⚠️ POZOR — víceznačné názvy obcí, NEHÁDEJ:
   - "Varvažov": Ústecký (u Chlumce/Ústí n.L.) NEBO Jihočeský (u Písku)
   - "Telnice": Ústecký (u Ústí n.L.) NEBO Jihomoravský (u Brna)
   - "Telč": Vysočina (NE Jihočeský!)
   - "Želiv": Vysočina (u Humpolce)
   - "Kněžmost": Středočeský (okres Mladá Boleslav, ne Liberec!)
   - "Karlovka" v Krkonoších: Královéhradecký (ne Liberecký)

   Pokud nemůžeš jednoznačně určit kraj z URL/popisu → confidence "low".

2. TYPE (architektura)
   Povolené: ${VALID_TYPES.join(" | ")}

   - "zámek/chateau/château" v názvu → "Zámek"
   - "hotel/resort/penzion" (ne zámek) → "Hotel"
   - "statek/dvůr/mlýn/stodola/ranč/farma/usedlost" → "Venkovský statek"
   - "vinný sklep/vinařství" → "Vinný sklep"
   - "loft/hala/industriální" → "Moderní prostor"
   - "louka/příroda/u vody/samota/rybník" → "Pláž / Příroda"
   - Jinak → "Historická budova"

3. NEAREST_CITY (do 90 min autem)
   Povolené: ${VALID_CITIES.join(" | ")}

   - MSK / sever Olomouckého / sever Zlínského → Ostrava
   - JM / Vysočina / Zlínský jih → Brno (Vysočina je Brno!)
   - Olomoucký jih → Olomouc
   - Jihočeský → České Budějovice
   - Plzeňský / Karlovarský → Plzeň
   - Liberecký → Liberec
   - Královéhradecký / Pardubický → Hradec Králové
   - Středočeský / Praha / jih Ústeckého → Praha

4. CATERING_POLICY
   Povolené: ${VALID_CATERING.join(" | ")}

   - own_free = vlastní jídlo I pití povoleno bez poplatků
   - own_drinks_free = jen vlastní pití (jídlo musí být od místa)
   - only_venue = jen catering od místa (zákaz vlastního)
   - negotiable = lze domluvit / nevíme

   Vyber podle features / popisu. Pokud nelze určit → "negotiable".

5. NIGHT_PARTY_POLICY
   Povolené: ${VALID_PARTY.join(" | ")}

   - no_curfew = bez nočního klidu, party do rána
   - indoor_after_22 = po 22:00 přesun dovnitř
   - quiet_hours = noční klid, party končí v 22:00
   - negotiable = nelze určit

6. FEATURES (klíčové slova pro vyhledávání)
   Vrať pole 3-8 stručných (1-3 slova) hodnot — z popisu/aktuálních features.
   Příklady: "Wellness", "Pet-friendly", "Dětské hřiště", "Vinný sklep",
   "Bez nočního klidu", "Soukromý areál", "Kuchyně k dispozici",
   "Bezbariérovost", "Bazén", "Sauna", "Krb", "Zahrada"

VRAŤ POUZE JSON (žádný markdown, žádný text okolo):
{
  "region": "...",
  "type": "...",
  "nearest_city": "...",
  "catering_policy": "...",
  "night_party_policy": "...",
  "features": ["...", "..."],
  "confidence": "high|medium|low",
  "reason": "krátké vysvětlení (1 věta)"
}

confidence:
- "high" — jasné z URL/popisu/názvu obce
- "medium" — odvozeno z kontextu
- "low" — málo info nebo nejednoznačné`

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    })

    const textBlock = response.content.find((b) => b.type === "text")
    if (!textBlock || textBlock.type !== "text") return null

    let jsonText = textBlock.text.trim()
    const m = jsonText.match(/\{[\s\S]*\}/)
    if (m) jsonText = m[0]

    const parsed = JSON.parse(jsonText) as VerifiedData

    // Validace návratu
    if (!VALID_REGIONS.includes(parsed.region)) return null
    if (!VALID_TYPES.includes(parsed.type)) return null
    if (!VALID_CITIES.includes(parsed.nearest_city)) return null
    if (!VALID_CATERING.includes(parsed.catering_policy)) return null
    if (!VALID_PARTY.includes(parsed.night_party_policy)) return null

    return parsed
  } catch (e) {
    console.error(`   ❌ Claude error: ${e instanceof Error ? e.message : e}`)
    return null
  }
}

// MANUÁLNÍ POTVRZENÍ — místa, jejichž data jsou ověřená Patrikom/Mončou.
// Tato se nepřepisují AI verifikací (lock).
const LOCKED_TITLES = [
  "štáblovice", "stablovice",
  "garden u holubů", "garden u holubu",
  "tereza",
  "varvažov", "varvazov", "stará pošta",
  "smrčiny", "smrciny",
  "karlovka",
  "ranč telč", "ranc telc",
  "cerhů", "cerhu", "kněžmost", "knezmost",
]

function isLocked(title: string): boolean {
  const t = title.toLowerCase()
  return LOCKED_TITLES.some((kw) => t.includes(kw))
}

async function main() {
  console.log("🤖 KOMPLETNÍ verifikace všech polí (region + typ + město + catering + party + features)\n")

  const { data, error } = await supabase
    .from("venues")
    .select("id, title, description, location, region, type, nearest_city, features, website_url, catering_policy, night_party_policy, is_featured")
    .order("is_featured", { ascending: false })

  if (error) { console.error("❌", error.message); process.exit(1) }
  const venues = (data ?? []) as VenueRow[]

  console.log(`📊 ${venues.length} míst k ověření\n`)

  let locked = 0
  const fixed: Record<string, number> = { region: 0, type: 0, nearest_city: 0, catering_policy: 0, night_party_policy: 0, features: 0 }
  let skipped = 0
  let errors = 0
  const lockChanges: string[] = []

  for (let i = 0; i < venues.length; i++) {
    const v = venues[i]
    const vip = v.is_featured ? "⭐ " : "   "
    process.stdout.write(`\r${i + 1}/${venues.length}  ${vip}${v.title.substring(0, 38).padEnd(38)}`)

    if (isLocked(v.title)) {
      locked++
      continue
    }

    const verified = await verifyVenue(v)
    if (!verified) {
      errors++
      continue
    }

    if (verified.confidence === "low") {
      skipped++
      continue
    }

    const updates: Record<string, string | string[]> = {}
    if (verified.region !== v.region) { updates.region = verified.region; fixed.region++ }
    if (verified.type !== v.type) { updates.type = verified.type; fixed.type++ }
    if (verified.nearest_city !== v.nearest_city) { updates.nearest_city = verified.nearest_city; fixed.nearest_city++ }
    if (verified.catering_policy !== v.catering_policy) { updates.catering_policy = verified.catering_policy; fixed.catering_policy++ }
    if (verified.night_party_policy !== v.night_party_policy) { updates.night_party_policy = verified.night_party_policy; fixed.night_party_policy++ }

    // Features — přepsat jen pokud má méně než 3
    if ((v.features ?? []).length < 3 && verified.features.length >= 3) {
      updates.features = verified.features.slice(0, 8)
      fixed.features++
    }

    if (Object.keys(updates).length > 0) {
      const { error: updErr } = await supabase.from("venues").update(updates).eq("id", v.id)
      if (updErr) console.error(`\n   ❌ ${v.title}: ${updErr.message}`)
    }
  }

  console.log("\n\n" + "═".repeat(70))
  console.log("✅ VERIFIKACE DOKONČENA\n")
  console.log(`   🔒 zamčená (LOCKED, manuálně potvrzena) ${locked}`)
  console.log(`   ${fixed.region}× region`)
  console.log(`   ${fixed.type}× type`)
  console.log(`   ${fixed.nearest_city}× nearest_city`)
  console.log(`   ${fixed.catering_policy}× catering_policy`)
  console.log(`   ${fixed.night_party_policy}× night_party_policy`)
  console.log(`   ${fixed.features}× features (doplněno tam, kde chyběly)`)
  console.log(`   ${skipped}× přeskočeno (low confidence)`)
  console.log(`   ${errors}× error`)
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1) })
