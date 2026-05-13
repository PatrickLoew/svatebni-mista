/**
 * Rychlá oprava: Zámecký resort Štáblovice je v Moravskoslezském kraji,
 * ne Středočeském. Opraví to v Supabase okamžitě (bez nutnosti spouštět
 * celý sync).
 *
 * Použití: npm run fix-stablovice
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

interface FixRule {
  titleMatch: string  // substring v title (case-insensitive)
  region?: string
  nearestCity?: string | null
  type?: string  // Zámek, Hotel, Venkovský statek, Vinný sklep, Pláž / Příroda, Moderní prostor, Historická budova
}

const FIXES: FixRule[] = [
  // Štáblovice — Moravskoslezský kraj, JE ZÁMEK (Zámecký resort)
  { titleMatch: "štáblovice", region: "Moravskoslezský", nearestCity: "Ostrava", type: "Zámek" },
  { titleMatch: "stablovice", region: "Moravskoslezský", nearestCity: "Ostrava", type: "Zámek" },

  // Hotel Garden u Holubů — Moravskoslezský, je to Hotel (ne historická budova)
  { titleMatch: "garden u holubů", type: "Hotel", nearestCity: "Ostrava" },
  { titleMatch: "garden u holubu", type: "Hotel", nearestCity: "Ostrava" },

  // Další VIP místa s pravděpodobně špatným typem (Zámek/Hotel)
  // — odkomentuj/doplň podle skutečnosti, pokud Monča řekne
  // { titleMatch: "zámeček dubí", type: "Zámek" },  // už správně (Zámek)
  // { titleMatch: "zámek čekanice", type: "Zámek" }, // už správně
]

async function main() {
  console.log("🔧 Opravuju VIP místa (kraj + město + typ)...\n")
  const { data, error } = await supabase.from("venues").select("id, title, region, nearest_city, type")
  if (error) { console.error("❌", error.message); process.exit(1) }
  const venues = data ?? []

  let fixed = 0
  for (const v of venues) {
    const titleLower = (v.title ?? "").toLowerCase()
    for (const rule of FIXES) {
      if (titleLower.includes(rule.titleMatch)) {
        const needsRegion = rule.region && v.region !== rule.region
        const needsCity = rule.nearestCity && v.nearest_city !== rule.nearestCity
        const needsType = rule.type && v.type !== rule.type

        if (needsRegion || needsCity || needsType) {
          const updates: Record<string, string> = {}
          if (needsRegion) updates.region = rule.region!
          if (needsCity) updates.nearest_city = rule.nearestCity!
          if (needsType) updates.type = rule.type!

          const { error: updErr } = await supabase
            .from("venues")
            .update(updates)
            .eq("id", v.id)
          if (updErr) {
            console.error(`❌ ${v.title}: ${updErr.message}`)
          } else {
            console.log(`✓ ${v.title}`)
            if (needsRegion) console.log(`   region: ${v.region} → ${rule.region}`)
            if (needsCity) console.log(`   nearest_city: ${v.nearest_city ?? "—"} → ${rule.nearestCity}`)
            if (needsType) console.log(`   type: ${v.type} → ${rule.type}`)
            fixed++
          }
        } else {
          console.log(`✓ ${v.title} — už správně`)
        }
        break
      }
    }
  }
  console.log(`\n✅ Opraveno ${fixed} míst`)
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1) })
