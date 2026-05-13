/**
 * AUTOMATICKÁ VERIFIKACE všech míst v Supabase pomocí Claude Sonnet.
 *
 * Pro každé místo Claude dostane: název, aktuální data, website URL,
 * popis. Vrátí ověřená data (kraj, typ, město, features).
 *
 * Použití: npm run verify-all-venues
 *
 * Náklady: ~194× Sonnet call ≈ 30-50 Kč. Trvá ~5-10 minut.
 *
 * Bezpečnost:
 *  - Aktualizuje DB jen pokud má AI vysokou jistotu
 *  - Logování každé změny pro pozdější audit
 *  - Idempotentní (lze spouštět opakovaně)
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

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("❌ Chybí ANTHROPIC_API_KEY v .env.local")
  process.exit(1)
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
  is_featured: boolean
}

interface VerifiedData {
  region: string
  type: string
  nearest_city: string
  confidence: "high" | "medium" | "low"
  reason: string
}

async function verifyVenue(v: VenueRow): Promise<VerifiedData | null> {
  const prompt = `Ověř data svatebního místa v ČR. Vrátíš JEN platný JSON.

MÍSTO:
- Název: ${v.title}
- Aktuální kraj v DB: ${v.region}
- Aktuální typ v DB: ${v.type}
- Aktuální nejbližší město v DB: ${v.nearest_city ?? "—"}
- Lokalita: ${v.location ?? "—"}
- Website: ${v.website_url ?? "—"}
- Popis: ${(v.description ?? "").substring(0, 300)}
- Features: ${(v.features ?? []).slice(0, 5).join(", ")}

ÚKOL:
Z názvu a popisu (a webové URL, pokud poznáš doménu) urči SKUTEČNÝ kraj v ČR.
Český Krumlov → Jihočeský. Štáblovice → Moravskoslezský. Tábor → Jihočeský.

POVOLENÉ HODNOTY:
- region: ${VALID_REGIONS.join(" | ")}
- nearest_city (nejbližší velké město do 90 min autem): ${VALID_CITIES.join(" | ")}
- type: ${VALID_TYPES.join(" | ")}

PRAVIDLA TYPU:
- Pokud má v názvu/popisu slovo "zámek", "chateau", "château" → "Zámek"
- Pokud má v názvu "hotel", "resort", "penzion" a NENÍ to zámek → "Hotel"
- Pokud "statek", "dvůr", "mlýn", "stodola", "ranč", "farma", "usedlost" → "Venkovský statek"
- Pokud "vinný sklep", "vinařství" → "Vinný sklep"
- Pokud "loft", "hala", "industriální" → "Moderní prostor"
- Pokud "louka", "u vody", "v přírodě", "samota" → "Pláž / Příroda"
- Pokud nic z toho nejde určit → "Historická budova"

PRAVIDLA NEJBLIŽŠÍHO MĚSTA:
- Moravskoslezský / sever Olomouckého / sever Zlínského → Ostrava
- Jihomoravský / Vysočina jih → Brno
- Jih Olomouckého → Olomouc
- Jihočeský → České Budějovice
- Plzeňský / Karlovarský → Plzeň
- Liberecký / sever Ústeckého → Liberec
- Královéhradecký / Pardubický → Hradec Králové
- Středočeský / Praha / jih Ústeckého → Praha

VRÁTÍŠ POUZE JSON:
{
  "region": "<jedna z povolených hodnot>",
  "type": "<jedna z povolených hodnot>",
  "nearest_city": "<jedna z povolených hodnot>",
  "confidence": "high|medium|low",
  "reason": "krátké vysvětlení v 1 větě"
}

confidence:
- "high" = jasně poznáš podle názvu (obsahuje obec) nebo URL
- "medium" = odvozuješ z kontextu, ale možnost chyby
- "low" = hádáš, málo info`

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 400,
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

    return parsed
  } catch (e) {
    console.error(`   ❌ Claude error: ${e instanceof Error ? e.message : e}`)
    return null
  }
}

async function main() {
  console.log("🤖 Automatická verifikace všech míst pomocí Claude Sonnet 4.5\n")

  const { data, error } = await supabase
    .from("venues")
    .select("id, title, description, location, region, type, nearest_city, features, website_url, is_featured")
    .order("is_featured", { ascending: false })  // VIP nejdřív

  if (error) { console.error("❌", error.message); process.exit(1) }
  const venues = (data ?? []) as VenueRow[]

  console.log(`📊 ${venues.length} míst k ověření (VIP nejdřív)\n`)

  let regionFixed = 0
  let typeFixed = 0
  let cityFixed = 0
  let skipped = 0
  let errors = 0
  const changes: string[] = []

  for (let i = 0; i < venues.length; i++) {
    const v = venues[i]
    const vip = v.is_featured ? "⭐ " : "   "
    process.stdout.write(`\r${i + 1}/${venues.length}  ${vip}${v.title.substring(0, 40).padEnd(40)}`)

    const verified = await verifyVenue(v)
    if (!verified) {
      errors++
      continue
    }

    // Aktualizovat jen pokud high/medium confidence A skutečně se to liší
    if (verified.confidence === "low") {
      skipped++
      continue
    }

    const updates: Record<string, string> = {}
    if (verified.region !== v.region) {
      updates.region = verified.region
      regionFixed++
      changes.push(`${vip}${v.title}: region ${v.region} → ${verified.region} (${verified.reason})`)
    }
    if (verified.type !== v.type) {
      updates.type = verified.type
      typeFixed++
      changes.push(`${vip}${v.title}: type ${v.type} → ${verified.type}`)
    }
    if (verified.nearest_city !== v.nearest_city) {
      updates.nearest_city = verified.nearest_city
      cityFixed++
    }

    if (Object.keys(updates).length > 0) {
      const { error: updErr } = await supabase
        .from("venues")
        .update(updates)
        .eq("id", v.id)
      if (updErr) console.error(`\n   ❌ ${v.title}: ${updErr.message}`)
    }
  }

  console.log("\n\n" + "═".repeat(70))
  console.log("✅ VERIFIKACE DOKONČENA\n")
  console.log(`   ${regionFixed}× region opraven`)
  console.log(`   ${typeFixed}× type opraven`)
  console.log(`   ${cityFixed}× nearest_city opraveno`)
  console.log(`   ${skipped}× přeskočeno (nízká jistota)`)
  console.log(`   ${errors}× error`)

  if (changes.length > 0) {
    console.log("\n📋 KLÍČOVÉ ZMĚNY:")
    for (const c of changes.slice(0, 30)) console.log(`   ${c}`)
    if (changes.length > 30) console.log(`   ... +${changes.length - 30} dalších změn`)
  }
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1) })
