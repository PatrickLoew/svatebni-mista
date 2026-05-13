/**
 * Audit svatebních míst v Supabase.
 *
 * Co kontroluje:
 *  - Kolik míst, kolik VIP
 *  - Vyplněnost klíčových polí (catering_policy, night_party_policy, type, region, nearest_city, accommodation_capacity)
 *  - VIP rozdělení podle krajů
 *  - Zámky / hrady — kde jsou
 *  - Duplicity podle názvu
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

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Chybí Supabase env proměnné")
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

interface VenueRow {
  id: string; slug: string; title: string; region: string; type: string
  nearest_city: string | null; capacity: number; price_from: number
  is_featured: boolean; catering_policy: string | null
  night_party_policy: string | null; accommodation_capacity: number | null
  description: string | null; features: string[] | null
  website_url: string | null
}

async function main() {
  console.log("🔍 Audit Supabase venues...\n")
  const { data, error } = await supabase.from("venues").select("*")
  if (error) { console.error("❌", error.message); process.exit(1) }
  const venues = (data ?? []) as VenueRow[]

  // 1) Celkové počty
  console.log(`📊 CELKEM: ${venues.length} míst`)
  const vips = venues.filter((v) => v.is_featured)
  console.log(`   z toho VIP: ${vips.length}\n`)

  // 2) Vyplněnost polí
  console.log("🔍 VYPLNĚNOST POLÍ:")
  const fieldStats = {
    "type": venues.filter((v) => v.type && v.type !== "Historická budova").length,
    "region": venues.filter((v) => v.region).length,
    "nearest_city": venues.filter((v) => v.nearest_city).length,
    "catering_policy": venues.filter((v) => v.catering_policy && v.catering_policy !== "negotiable").length,
    "night_party_policy": venues.filter((v) => v.night_party_policy && v.night_party_policy !== "negotiable").length,
    "accommodation_capacity > 0": venues.filter((v) => (v.accommodation_capacity ?? 0) > 0).length,
    "description (>50 znaků)": venues.filter((v) => (v.description ?? "").length > 50).length,
    "features (≥3)": venues.filter((v) => (v.features ?? []).length >= 3).length,
    "website_url": venues.filter((v) => v.website_url).length,
  }
  for (const [field, count] of Object.entries(fieldStats)) {
    const pct = Math.round((count / venues.length) * 100)
    const bar = "█".repeat(Math.floor(pct / 5)).padEnd(20, "░")
    console.log(`   ${field.padEnd(35)} ${bar} ${count}/${venues.length} (${pct}%)`)
  }

  // 3) VIP rozdělení podle krajů
  console.log("\n⭐ VIP MÍSTA PODLE KRAJŮ:")
  const vipByRegion: Record<string, VenueRow[]> = {}
  for (const v of vips) {
    if (!vipByRegion[v.region]) vipByRegion[v.region] = []
    vipByRegion[v.region].push(v)
  }
  for (const [region, list] of Object.entries(vipByRegion).sort()) {
    console.log(`   ${region.padEnd(25)} ${list.length}× — ${list.map((v) => v.title).join(", ").substring(0, 100)}`)
  }

  // 4) Zámky a hrady
  console.log("\n🏰 ZÁMKY / HRADY V DB:")
  const castles = venues.filter((v) => v.type === "Zámek")
  console.log(`   Celkem typ "Zámek": ${castles.length}`)
  for (const c of castles) {
    const vip = c.is_featured ? "⭐VIP" : "   "
    console.log(`   ${vip} ${c.title.padEnd(35)} | ${c.region.padEnd(20)} | ${c.nearest_city ?? "—"}`)
  }

  // 5) Typy
  console.log("\n📂 ROZDĚLENÍ TYPŮ:")
  const typeCounts: Record<string, number> = {}
  for (const v of venues) typeCounts[v.type] = (typeCounts[v.type] ?? 0) + 1
  for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${type.padEnd(25)} ${count}×`)
  }

  // 6) Catering policies
  console.log("\n🍽 CATERING POLICIES:")
  const catCounts: Record<string, number> = {}
  for (const v of venues) catCounts[v.catering_policy ?? "null"] = (catCounts[v.catering_policy ?? "null"] ?? 0) + 1
  for (const [policy, count] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${policy.padEnd(25)} ${count}×`)
  }

  // 7) Party policies
  console.log("\n🎉 NIGHT PARTY POLICIES:")
  const partyCounts: Record<string, number> = {}
  for (const v of venues) partyCounts[v.night_party_policy ?? "null"] = (partyCounts[v.night_party_policy ?? "null"] ?? 0) + 1
  for (const [policy, count] of Object.entries(partyCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${policy.padEnd(25)} ${count}×`)
  }

  // 8) Moravskoslezské zámky (problém co popsal Patrik)
  console.log("\n🔍 MORAVSKOSLEZSKÉ MÍSTA (Patrikův test):")
  const moravskoslezske = venues.filter((v) =>
    ["Moravskoslezský", "Olomoucký", "Zlínský"].includes(v.region),
  )
  console.log(`   Celkem: ${moravskoslezske.length}`)
  for (const v of moravskoslezske) {
    const vip = v.is_featured ? "⭐VIP" : "   "
    console.log(`   ${vip} ${v.title.padEnd(35)} | ${v.type.padEnd(20)} | ${v.region}`)
  }
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1) })
