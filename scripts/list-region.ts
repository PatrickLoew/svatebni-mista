/**
 * Vypíše všechna místa v zadaném kraji.
 * Použití: npx tsx scripts/list-region.ts "Královéhradecký"
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

const region = process.argv[2] ?? "Královéhradecký"

async function main() {
  const { data, error } = await supabase
    .from("venues")
    .select("title, type, capacity, price_from, nearest_city, is_featured, catering_policy, night_party_policy, accommodation_capacity")
    .eq("region", region)
    .order("is_featured", { ascending: false })
    .order("capacity", { ascending: false })

  if (error) { console.error("❌", error.message); process.exit(1) }
  const venues = data ?? []

  console.log(`📍 ${venues.length} míst v kraji "${region}":\n`)

  for (const v of venues) {
    const vip = v.is_featured ? "⭐VIP" : "    "
    console.log(`${vip} ${v.title.padEnd(40)} | ${v.type.padEnd(20)} | ${String(v.capacity).padStart(3)} hostů | od ${String(v.price_from).padStart(7)} Kč`)
    console.log(`      ${v.nearest_city ?? "—"} | catering: ${v.catering_policy ?? "—"} | party: ${v.night_party_policy ?? "—"} | lůžek: ${v.accommodation_capacity ?? 0}`)
  }
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1) })
