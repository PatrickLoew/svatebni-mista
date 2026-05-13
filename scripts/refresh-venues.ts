/**
 * Bezpečný refresh dat v Supabase — NEMAŽE, jen aktualizuje.
 *
 * Co dělá:
 *  - Pro každé místo v DB zkusí najít lepší typ (Zámek, Hotel...) z názvu
 *  - Doplní nearest_city, pokud chybí (z kraje)
 *  - Loguje co opravuje, co ne
 *
 * Použití: npm run refresh-venues
 *
 * Bezpečnost: idempotentní, lze spouštět opakovaně.
 */
import fs from "fs"
import path from "path"
import { createClient } from "@supabase/supabase-js"

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

interface VenueRow {
  id: string
  title: string
  description: string | null
  region: string
  type: string
  nearest_city: string | null
  features: string[] | null
  is_featured: boolean
}

/* ─────────── DETEKTORY ─────────── */

function inferTypeFromTitle(title: string, features: string): string | null {
  const s = `${title} ${features}`.toLowerCase()
  if (s.includes("zámek") || s.includes("zámeč") || s.includes("zameck") || s.includes("château") || s.includes("chateau") || s.includes("hrad ")) return "Zámek"
  if (s.includes("vinný sklep") || s.includes("vinný") || s.includes("vinař") || s.includes("sklep") || s.includes("sklíp")) return "Vinný sklep"
  if (s.includes("hotel") || s.includes("resort") || s.includes("penzion")) return "Hotel"
  if (s.includes("mlýn") || s.includes("stodola") || s.includes("statek") || s.includes("dvůr") || s.includes("ranč") || s.includes("ranch") || s.includes("farma") || s.includes("usedlost")) return "Venkovský statek"
  if (s.includes("loft") || s.includes("hala") || s.includes("továrn") || s.includes("industriál")) return "Moderní prostor"
  if (s.includes("louka") || s.includes("příroda") || s.includes("samot") || s.includes("u vody") || s.includes("rybník")) return "Pláž / Příroda"
  return null
}

function inferCityFromRegion(region: string, existing: string | null): string | null {
  if (existing) return existing
  const map: Record<string, string> = {
    "Praha": "Praha",
    "Středočeský": "Praha",
    "Ústecký": "Praha",
    "Liberecký": "Liberec",
    "Královéhradecký": "Hradec Králové",
    "Pardubický": "Hradec Králové",
    "Plzeňský": "Plzeň",
    "Karlovarský": "Plzeň",
    "Jihočeský": "České Budějovice",
    "Vysočina": "Brno",
    "Jihomoravský": "Brno",
    "Zlínský": "Ostrava",
    "Olomoucký": "Olomouc",
    "Moravskoslezský": "Ostrava",
  }
  return map[region] ?? null
}

/* ─────────── HLAVNÍ ─────────── */

async function main() {
  console.log("🔄 Bezpečný refresh dat v Supabase...\n")

  const { data, error } = await supabase
    .from("venues")
    .select("id, title, description, region, type, nearest_city, features, is_featured")

  if (error) { console.error("❌", error.message); process.exit(1) }
  const venues = (data ?? []) as VenueRow[]

  let typeFixed = 0
  let cityFixed = 0
  const noTypeChange: string[] = []

  for (const v of venues) {
    const updates: Record<string, string> = {}

    // Typ
    const featuresStr = (v.features ?? []).join(" ")
    const newType = inferTypeFromTitle(v.title, featuresStr)
    // Pouze přepiš pokud nový typ je víc specifický než "Historická budova" (defaultní)
    if (newType && newType !== v.type && v.type === "Historická budova") {
      updates.type = newType
    }

    // Nejbližší město
    const newCity = inferCityFromRegion(v.region, v.nearest_city)
    if (newCity && newCity !== v.nearest_city) {
      updates.nearest_city = newCity
    }

    if (Object.keys(updates).length > 0) {
      const { error: updErr } = await supabase
        .from("venues")
        .update(updates)
        .eq("id", v.id)

      if (updErr) {
        console.error(`❌ ${v.title}: ${updErr.message}`)
      } else {
        const changes: string[] = []
        if (updates.type) {
          changes.push(`type: ${v.type} → ${updates.type}`)
          typeFixed++
        }
        if (updates.nearest_city) {
          changes.push(`city: ${v.nearest_city ?? "—"} → ${updates.nearest_city}`)
          cityFixed++
        }
        const vip = v.is_featured ? "⭐ " : ""
        console.log(`✓ ${vip}${v.title}`)
        for (const c of changes) console.log(`   ${c}`)
      }
    } else if (v.type === "Historická budova" && !inferTypeFromTitle(v.title, featuresStr)) {
      noTypeChange.push(v.title)
    }
  }

  console.log(`\n✅ Opraveno:`)
  console.log(`   ${typeFixed}× type (z "Historická budova" na specifický)`)
  console.log(`   ${cityFixed}× nearest_city (doplněno z kraje)`)

  if (noTypeChange.length > 0) {
    console.log(`\n⚠️ Místa zůstávají "Historická budova" — nelze odvodit z názvu (${noTypeChange.length}):`)
    for (const t of noTypeChange.slice(0, 10)) console.log(`   - ${t}`)
    if (noTypeChange.length > 10) console.log(`   ... +${noTypeChange.length - 10} dalších`)
  }
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1) })
