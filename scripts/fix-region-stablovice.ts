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
  region: string
  nearestCity: string | null
}

const FIXES: FixRule[] = [
  // Moravskoslezský kraj
  { titleMatch: "štáblovice", region: "Moravskoslezský", nearestCity: "Ostrava" },
  { titleMatch: "stablovice", region: "Moravskoslezský", nearestCity: "Ostrava" },
  // Další VIP místa, která by mohla být v špatném kraji — můžeme dodat podle potřeby
]

async function main() {
  console.log("🔧 Opravuju kraje VIP míst...\n")
  const { data, error } = await supabase.from("venues").select("id, title, region, nearest_city")
  if (error) { console.error("❌", error.message); process.exit(1) }
  const venues = data ?? []

  let fixed = 0
  for (const v of venues) {
    const titleLower = (v.title ?? "").toLowerCase()
    for (const rule of FIXES) {
      if (titleLower.includes(rule.titleMatch)) {
        const needsRegionFix = v.region !== rule.region
        const needsCityFix = v.nearest_city !== rule.nearestCity
        if (needsRegionFix || needsCityFix) {
          const updates: Record<string, string> = {}
          if (needsRegionFix) updates.region = rule.region
          if (needsCityFix && rule.nearestCity) updates.nearest_city = rule.nearestCity

          const { error: updErr } = await supabase
            .from("venues")
            .update(updates)
            .eq("id", v.id)
          if (updErr) {
            console.error(`❌ ${v.title}: ${updErr.message}`)
          } else {
            console.log(`✓ ${v.title}`)
            console.log(`  region: ${v.region} → ${rule.region}`)
            if (needsCityFix) console.log(`  nearest_city: ${v.nearest_city ?? "—"} → ${rule.nearestCity}`)
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
