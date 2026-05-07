/**
 * Import skript pro hromadné nahrání svatebních míst do Supabase
 *
 * Použití:
 *   1. Ulož svůj CSV soubor do data/venues.csv
 *   2. Nastav v .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   3. Spusť: npx tsx scripts/import-venues.ts
 */

import fs from "fs"
import path from "path"
import { createClient } from "@supabase/supabase-js"

// Načti env
require("dotenv").config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error("❌ Chybí NEXT_PUBLIC_SUPABASE_URL nebo SUPABASE_SERVICE_ROLE_KEY v .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

/**
 * Naivní CSV parser, který umí pole obalená uvozovkami a uvozovky uvnitř (zdvojené).
 * Stačí pro Google Forms exporty.
 */
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') { inQuotes = false }
      else { cell += c }
    } else {
      if (c === '"') { inQuotes = true }
      else if (c === ",") { row.push(cell); cell = "" }
      else if (c === "\n" || c === "\r") {
        if (cell !== "" || row.length > 0) {
          row.push(cell)
          rows.push(row)
          row = []
          cell = ""
        }
        if (c === "\r" && text[i + 1] === "\n") i++
      } else { cell += c }
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""))
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

/* ---- Mapování textu na enumy ---- */

const REGION_MAP: Record<string, string> = {
  "Středočeský": "Středočeský", "Středočeský kraj": "Středočeský",
  "Jihočeský": "Jihočeský", "Plzeňský": "Plzeňský",
  "Karlovarský": "Karlovarský", "Ústecký": "Ústecký", "Ústecký kraj": "Ústecký",
  "Liberecký": "Liberecký", "Liberecký Kraj": "Liberecký",
  "Královohradecký": "Královéhradecký", "Královéhradecký": "Královéhradecký",
  "Hradecký kraj": "Královéhradecký",
  "Pardubický": "Pardubický", "Vysočina": "Vysočina",
  "Jihomoravský": "Jihomoravský", "Olomoucký": "Olomoucký",
  "Zlínský": "Zlínský", "Moravskoslezský": "Moravskoslezský",
  "Beskydy": "Moravskoslezský", "Praha": "Praha",
  "Slovensko": "Slovensko", "Evropské státy": "Slovensko",
}

function mapType(formType: string): string {
  const t = formType.toLowerCase()
  if (t.includes("zámek") || t.includes("zámeček")) return "Zámek"
  if (t.includes("hrad")) return "Zámek"
  if (t.includes("vinařství") || t.includes("sklípek") || t.includes("sklep")) return "Vinný sklep"
  if (t.includes("hotel")) return "Hotel"
  if (t.includes("zahrada")) return "Zahrada"
  if (t.includes("mlýn") || t.includes("stodola") || t.includes("statek")) return "Venkovský statek"
  if (t.includes("industriál") || t.includes("loft")) return "Moderní prostor"
  if (t.includes("fara") || t.includes("klášter") || t.includes("historic")) return "Historická budova"
  if (t.includes("příroda") || t.includes("louka") || t.includes("les") || t.includes("u vody")) return "Pláž / Příroda"
  if (t.includes("toskánský")) return "Moderní prostor"
  if (t.includes("sál")) return "Historická budova"
  return "Historická budova"
}

function parseCapacity(s: string): number {
  if (!s) return 80
  const m = s.match(/\d+/g)
  if (!m) return 80
  if (s.toLowerCase().includes("nad")) return Math.max(...m.map(Number)) + 50
  return Math.max(...m.map(Number))
}

function parsePrice(s: string): number {
  if (!s) return 100000
  const m = s.replace(/\s/g, "").match(/\d+(?:[.,]\d+)?/g)
  if (!m) return 100000
  const val = parseFloat(m[0].replace(/[.,]/g, ""))
  if (val < 1000) return val * 1000  // např. "50" → 50000
  return val
}

function mapAccommodation(s: string): number {
  if (!s) return 0
  if (s.includes("Nemáme")) return 0
  const m = s.match(/\d+/)
  return m ? Number(m[0]) : 30
}

function mapCatering(s: string): "own_free" | "own_drinks_free" | "only_venue" | "negotiable" {
  if (!s) return "negotiable"
  const t = s.toLowerCase()
  if (t.includes("vlastního pití a jídla bez poplatků") || t.includes("vlastní pití a jídla bez poplatků")) return "own_free"
  if (t.includes("vlastní pití") && !t.includes("musí mít")) return "own_drinks_free"
  if (t.includes("musí mít catering")) return "only_venue"
  return "negotiable"
}

function mapNightParty(s: string): "no_curfew" | "indoor_after_22" | "quiet_hours" {
  if (!s) return "indoor_after_22"
  const t = s.toLowerCase()
  if (t.includes("nerušíme noční klid")) return "no_curfew"
  if (t.includes("po 22") || t.includes("párty místnost") || t.includes("party místnost")) return "indoor_after_22"
  return "quiet_hours"
}

function mapNearestCity(s: string): string | null {
  if (!s) return null
  const t = s.toLowerCase()
  if (t.includes("praha")) return "Praha"
  if (t.includes("brno")) return "Brno"
  if (t.includes("budějovic")) return "České Budějovice"
  if (t.includes("plzn") || t.includes("plzeň")) return "Plzeň"
  if (t.includes("hradec")) return "Hradec Králové"
  if (t.includes("ostrav")) return "Ostrava"
  if (t.includes("olomouc")) return "Olomouc"
  if (t.includes("liberec")) return "Liberec"
  if (t.includes("šumperk")) return "Olomouc"
  if (t.includes("kolín")) return "Praha"
  return null
}

const PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1600&q=85",
  "https://images.unsplash.com/photo-1505932794465-147d1f1b2c97?w=1600&q=85",
  "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=1600&q=85",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600&q=85",
  "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1600&q=85",
]

/* ---- Hlavní import ---- */

async function main() {
  const csvPath = path.join(process.cwd(), "data", "venues.csv")
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Soubor ${csvPath} neexistuje. Ulož svůj CSV jako data/venues.csv.`)
    process.exit(1)
  }
  const text = fs.readFileSync(csvPath, "utf-8")
  const rows = parseCSV(text)
  if (rows.length < 2) {
    console.error("❌ CSV je prázdný nebo nesprávný formát.")
    process.exit(1)
  }

  const header = rows[0].map((h) => h.trim())
  const idx = (name: string) => header.findIndex((h) => h.toLowerCase().includes(name.toLowerCase()))

  const cols = {
    name:        idx("Jméno místa"),
    email:       idx("E-mail"),
    region:      idx("Lokalita - Kraj"),
    nearCity:    idx("Lokalita do 90"),
    capacity:    idx("Kapacita"),
    type:        idx("Architektonický"),
    accom:       idx("Ubytování"),
    services:    idx("Služby nabízené"),
    catering:    idx("Catering"),
    party:       idx("Večerní party"),
    features:    idx("přidané hodnoty"),
    rental:      idx("pronájem"),
    avgCost:     idx("Kolik u Vás průměrně"),
    extra:       idx("ještě něco"),
  }

  // Pro forms-export může být sloupec "Jméno místa" pojmenovaný jinak — zkus alternativy
  const realName = cols.name === -1 ? idx("jméno") : cols.name

  console.log("📋 Detekované sloupce:", cols)
  console.log(`📦 Řádků k zpracování: ${rows.length - 1}`)

  let imageRotation = 0
  let imported = 0
  let skipped = 0

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const title = (r[realName] ?? "").trim()
    if (!title || title.length < 2) { skipped++; continue }

    const region = REGION_MAP[(r[cols.region] ?? "").trim()] ?? "Středočeský"
    const slug = slugify(title)
    const type = mapType(r[cols.type] ?? "")
    const capacity = parseCapacity(r[cols.capacity] ?? "")
    const priceFrom = parsePrice(r[cols.rental] ?? "")
    const avgCost = parsePrice(r[cols.avgCost] ?? "0")

    // Vyber 2-3 placeholder fotky
    const images = [
      PLACEHOLDERS[imageRotation % PLACEHOLDERS.length],
      PLACEHOLDERS[(imageRotation + 1) % PLACEHOLDERS.length],
    ]
    imageRotation += 2

    // Sestaviv features z přidaných hodnot + accom
    const featuresText = (r[cols.features] ?? "").trim()
    const features = featuresText
      .split(/[,;\n•·]/)
      .map((f) => f.replace(/^[\s\-✔️✓★]+/, "").trim())
      .filter((f) => f.length > 2 && f.length < 80)
      .slice(0, 8)

    // Sestaviv services
    const services = ["Komplet vše na jednom místě"]
    if (mapCatering(r[cols.catering] ?? "") === "own_free") services.push("Vlastní jídlo a pití bez poplatků")
    if (mapNightParty(r[cols.party] ?? "") === "no_curfew") services.push("Bez nočního klidu")

    const description = [
      r[cols.type] ?? "",
      featuresText.slice(0, 200),
    ].filter(Boolean).join(" — ").slice(0, 500) || `Svatební místo ${title}.`

    const venue = {
      slug,
      title,
      description,
      location: `${region} kraj${r[cols.nearCity] ? ` — ${r[cols.nearCity]}` : ""}`,
      region,
      type,
      capacity,
      price_from: priceFrom,
      services,
      images,
      features,
      is_featured: i <= 8, // prvních 8 jako featured
      website_url: null,
      contact_email: (r[cols.email] ?? "").trim() || null,
      nearest_city: mapNearestCity(r[cols.nearCity] ?? ""),
      accommodation_capacity: mapAccommodation(r[cols.accom] ?? ""),
      catering_policy: mapCatering(r[cols.catering] ?? ""),
      night_party_policy: mapNightParty(r[cols.party] ?? ""),
      avg_wedding_cost: avgCost > 0 ? avgCost : null,
    }

    const { error } = await supabase.from("venues").upsert(venue, { onConflict: "slug" })
    if (error) {
      console.error(`❌ ${title}: ${error.message}`)
      skipped++
    } else {
      console.log(`✅ ${title}`)
      imported++
    }
  }

  console.log(`\n🎉 Hotovo. Importováno: ${imported}, přeskočeno: ${skipped}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
