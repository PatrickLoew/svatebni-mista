/**
 * Diagnostika konkrétního místa — porovná DB se sheetem.
 * Použití: npx tsx scripts/check-venue.ts "Hotel Cvilín"
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

const SHEET_URL = process.env.GOOGLE_SHEET_URL ||
  "https://docs.google.com/spreadsheets/d/1fxVeCixKlAtbNxAXFPXdqst1UJIft6Tp/export?format=csv&gid=1507971846"

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') inQ = false
      else cell += c
    } else {
      if (c === '"') inQ = true
      else if (c === ",") { row.push(cell); cell = "" }
      else if (c === "\n" || c === "\r") {
        if (cell !== "" || row.length > 0) { row.push(cell); rows.push(row); row = []; cell = "" }
        if (c === "\r" && text[i + 1] === "\n") i++
      } else cell += c
    }
  }
  if (cell !== "" || row.length > 0) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((c) => c.trim() !== ""))
}

const search = process.argv[2] ?? "Hotel Cvilín"

async function main() {
  // 1. DB
  console.log(`🔍 Hledám "${search}" v DB:\n`)
  const { data: dbData } = await supabase
    .from("venues")
    .select("*")
    .ilike("title", `%${search}%`)

  for (const v of dbData ?? []) {
    console.log(`✓ ${v.title}`)
    console.log(`   region: ${v.region} | type: ${v.type} | nearest_city: ${v.nearest_city}`)
    console.log(`   capacity: ${v.capacity} | accommodation_capacity: ${v.accommodation_capacity}`)
    console.log(`   catering_policy: ${v.catering_policy}`)
    console.log(`   night_party_policy: ${v.night_party_policy}`)
    console.log(`   description: ${(v.description ?? "").substring(0, 150)}...`)
    console.log(`   features: ${(v.features ?? []).join(", ")}`)
    console.log(`   website: ${v.website_url}`)
  }

  // 2. Sheet
  console.log("\n📥 Hledám ve sheetu...")
  const resp = await fetch(SHEET_URL)
  const text = await resp.text()
  const rows = parseCSV(text)

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const title = (r[1] ?? r[0] ?? "").toLowerCase()
    if (title.includes(search.toLowerCase())) {
      console.log(`\n✓ Řádek ${i}: ${r[1] ?? r[0]}`)
      // Pro nový formát
      if (r[1]) {
        console.log(`   [4] Kraj: "${r[4]}"`)
        console.log(`   [5] 90 min od: "${r[5]}"`)
        console.log(`   [6] Kapacita text: "${r[6]}"`)
        console.log(`   [7] Kapacita číslo: "${r[7]}"`)
        console.log(`   [8] Archtype: "${r[8]}"`)
        console.log(`   [9] Ubytování: "${r[9]}"`)
        console.log(`   [10] Ubytování normalizace: "${r[10]}"`)
        console.log(`   [12] Catering: "${r[12]}"`)
        console.log(`   [13] Catering norm: "${r[13]}"`)
        console.log(`   [14] Party: "${r[14]}"`)
        console.log(`   [15] Party norm: "${r[15]}"`)
        console.log(`   [16] Features: "${r[16]?.substring(0, 200)}"`)
      } else {
        // Starý formát
        console.log(`   [2] Kraj: "${r[2]}"`)
        console.log(`   [3] 90 min od: "${r[3]}"`)
        console.log(`   [4] Kapacita: "${r[4]}"`)
        console.log(`   [5] Archtype: "${r[5]}"`)
        console.log(`   [6] Ubytování: "${r[6]}"`)
        console.log(`   [7] Služby: "${r[7]}"`)
        console.log(`   [8] Catering: "${r[8]}"`)
        console.log(`   [9] Party: "${r[9]}"`)
        console.log(`   [10] Features: "${r[10]?.substring(0, 200)}"`)
      }
    }
  }
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1) })
