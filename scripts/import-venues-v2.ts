/**
 * Nahraje 194 míst (z toho 22 VIP) z venues-v2.csv přímo do Supabase.
 * Použití: npm run import-venues-v2
 *
 * Co dělá:
 *   1. Načte data/venues-v2.csv (obě sekce CSV: nový + starý formát)
 *   2. Dedupne podle názvu a fuzzy VIP keywordů
 *   3. Smaže staré venues v Supabase
 *   4. Nahraje 194 nových míst po dávkách
 *   5. Vypíše statistiky
 */

import fs from "fs"
import path from "path"
import { createClient } from "@supabase/supabase-js"

// Načti .env.local manuálně PŘED kontrolou
const envPath = path.join(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8")
  envContent.split("\n").forEach((line) => {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m) process.env[m[1]] = m[2].trim()
  })
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Chybí NEXT_PUBLIC_SUPABASE_URL nebo SUPABASE_SERVICE_ROLE_KEY v .env.local")
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/* ─────────── CSV parser ─────────── */

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

/* ─────────── HELPERS ─────────── */

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

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
  "Slovensko": "Slovensko",
}

function normalizeType(t: string): string {
  const s = t.toLowerCase()
  if (s.includes("zámek") || s.includes("zámeč") || s.includes("hrad")) return "Zámek"
  if (s.includes("hotel")) return "Hotel"
  if (s.includes("víno") || s.includes("vinař") || s.includes("sklep") || s.includes("sklíp")) return "Vinný sklep"
  if (s.includes("mlýn") || s.includes("stodola") || s.includes("statek") || s.includes("dvůr")) return "Venkovský statek"
  if (s.includes("industriál") || s.includes("loft")) return "Moderní prostor"
  if (s.includes("příroda") || s.includes("louka") || s.includes("les") || s.includes("u vody") || s.includes("samot")) return "Pláž / Příroda"
  if (s.includes("klášter") || s.includes("fara") || s.includes("histor")) return "Historická budova"
  return "Historická budova"
}

function mapCatering(s: string): string {
  const t = s.toLowerCase()
  if (t.includes("vlastní jídlo")) return "own_free"
  if (t.includes("vlastní pití")) return "own_drinks_free"
  if (t.includes("povinný") || t.includes("musí")) return "only_venue"
  return "negotiable"
}

function mapParty(s: string): string {
  const t = s.toLowerCase()
  if (t.includes("bez nočního") || t.includes("neruší") || t.includes("žádný noční")) return "no_curfew"
  if (t.includes("po 22") || t.includes("přesun") || t.includes("párty místnost") || t.includes("party místnost")) return "indoor_after_22"
  if (t.includes("max do 22") || t.includes("do 22")) return "quiet_hours"
  return "negotiable"
}

function mapNearestCity(t: string): string | null {
  const s = t.toLowerCase()
  if (s.includes("praha")) return "Praha"
  if (s.includes("brno")) return "Brno"
  if (s.includes("budějovic")) return "České Budějovice"
  if (s.includes("plzn") || s.includes("plzeň")) return "Plzeň"
  if (s.includes("hradec")) return "Hradec Králové"
  if (s.includes("ostrav")) return "Ostrava"
  if (s.includes("olomouc")) return "Olomouc"
  if (s.includes("liberec")) return "Liberec"
  return null
}

function parsePrice(s: string): number {
  if (!s) return 0
  const cleaned = s.replace(/\s/g, "").replace(/[.](?=\d{3})/g, "")
  const m = cleaned.match(/\d+/g)
  if (!m) return 0
  const val = Number(m[0])
  return val < 1000 ? val * 1000 : val
}

const PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1600&q=85",
  "https://images.unsplash.com/photo-1505932794465-147d1f1b2c97?w=1600&q=85",
  "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=1600&q=85",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600&q=85",
  "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1600&q=85",
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=85",
  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1600&q=85",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600&q=85",
  "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=1600&q=85",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1600&q=85",
]

const VIP_KEYWORDS = [
  "kvítkův", "zámeček dubí", "tereza", "stará pošta", "varvažov",
  "ralsko", "milešovkou", "čekanice", "vítovský", "bzí",
  "kapličky", "štáblovice", "u holubů", "victoria garden", "čapí hnízdo",
  "stodola pod lesem", "horní dvůr", "smrčiny", "barešův", "racek",
  "oblík", "villa bork", "ježkovec",
]

function isVipTitle(title: string): boolean {
  const t = title.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  return VIP_KEYWORDS.some((kw) => {
    const k = kw.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    return t.includes(k)
  })
}
function matchedVipKey(title: string): string | null {
  const t = title.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  for (const kw of VIP_KEYWORDS) {
    const k = kw.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    if (t.includes(k)) return k
  }
  return null
}

interface ParsedVenue {
  title: string; email: string; web: string; region: string; nearCity: string
  capacityNum: number; archType: string; accommodation: string
  catering: string; cateringNorm: string; party: string; partyNorm: string
  features: string; rental: string; avgCost: string
}

function parseNewFormat(rows: string[][], startIdx: number, endIdx: number): ParsedVenue[] {
  const out: ParsedVenue[] = []
  for (let i = startIdx; i < endIdx; i++) {
    const r = rows[i]
    if (!r[0] || !/^\d+$/.test(r[0].trim())) continue
    const title = (r[1] ?? "").trim()
    if (!title || title.includes("http") || title.includes("@")) continue
    out.push({
      title, email: r[2] ?? "", web: r[3] ?? "",
      region: r[4] ?? "", nearCity: r[5] ?? "",
      capacityNum: Number((r[7] ?? "").trim()) || 80,
      archType: r[8] ?? "", accommodation: r[9] ?? "",
      catering: r[12] ?? "", cateringNorm: r[13] ?? "",
      party: r[14] ?? "", partyNorm: r[15] ?? "",
      features: r[16] ?? "", rental: r[17] ?? "", avgCost: r[18] ?? "",
    })
  }
  return out
}

function parseOldFormat(rows: string[][], startIdx: number): ParsedVenue[] {
  const out: ParsedVenue[] = []
  for (let i = startIdx; i < rows.length; i++) {
    const r = rows[i]
    const title = (r[0] ?? "").trim()
    if (!title || title === "Jméno místa") continue
    if (title.includes("http") || title.includes("@") || title.startsWith("✔")) continue
    const emailWeb = r[1] ?? ""
    const email = (emailWeb.match(/[\w.-]+@[\w.-]+\.\w+/) ?? [""])[0]
    const web = (emailWeb.match(/https?:\/\/[^\s,]+/) ?? [""])[0]
    out.push({
      title, email, web,
      region: r[2] ?? "", nearCity: r[3] ?? "",
      capacityNum: Number((r[4] ?? "").replace(/\D/g, "")) || 80,
      archType: r[5] ?? "", accommodation: r[6] ?? "",
      catering: r[8] ?? "", cateringNorm: r[8] ?? "",
      party: r[9] ?? "", partyNorm: r[9] ?? "",
      features: r[10] ?? "", rental: r[11] ?? "", avgCost: r[12] ?? "",
    })
  }
  return out
}

/* ─────────── HLAVNÍ ─────────── */

async function main() {
  const csvPath = path.join(process.cwd(), "data", "venues-v2.csv")
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Soubor ${csvPath} neexistuje. Ulož ho prosím z Downloads do data/.`)
    process.exit(1)
  }

  console.log("📂 Čtu CSV...")
  const text = fs.readFileSync(csvPath, "utf-8")
  const rows = parseCSV(text)

  // Najdi rozdělovník — druhý header
  let splitIdx = rows.length
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0]?.trim() === "Jméno místa") {
      splitIdx = i
      break
    }
  }

  const newVenues = parseNewFormat(rows, 1, splitIdx)
  const oldVenues = parseOldFormat(rows, splitIdx + 1)
  console.log(`✓ Nový formát: ${newVenues.length} | Starý formát: ${oldVenues.length}`)

  // Dedupe
  const seenNames = new Set<string>()
  const seenVipKeywords = new Set<string>()
  const allVenues: ParsedVenue[] = []
  for (const v of [...oldVenues, ...newVenues]) {
    const normName = v.title.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim()
    if (seenNames.has(normName)) continue
    const vipKey = matchedVipKey(v.title)
    if (vipKey && seenVipKeywords.has(vipKey)) continue
    seenNames.add(normName)
    if (vipKey) seenVipKeywords.add(vipKey)
    allVenues.push(v)
  }

  console.log(`✓ Unique: ${allVenues.length} míst`)

  // Smaž existující venues
  console.log("\n🗑  Mažu staré venues v Supabase...")
  const { error: delErr } = await supabase.from("venues").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  if (delErr) {
    console.error("❌ Chyba při mazání:", delErr.message)
    process.exit(1)
  }
  console.log("✓ Smazáno")

  // Nahrávej po dávkách 50
  console.log("\n📤 Nahrávám místa do Supabase (po 50)...")
  const seenSlugs = new Set<string>()
  const records: object[] = []
  let imageRot = 0
  let vipCount = 0

  for (const v of allVenues) {
    let slug = slugify(v.title)
    if (!slug) continue
    const base = slug; let n = 2
    while (seenSlugs.has(slug)) slug = `${base}-${n++}`
    seenSlugs.add(slug)

    const region = REGION_MAP[v.region.trim()] ?? "Středočeský"
    const type = normalizeType(v.archType)
    const cateringPolicy = mapCatering(v.cateringNorm || v.catering)
    const nightPartyPolicy = mapParty(v.partyNorm || v.party)
    const isVip = isVipTitle(v.title)
    if (isVip) vipCount++

    const featuresText = v.features.trim()
    const features = featuresText
      .split(/[,;\n•·✔✓★]/)
      .map((f) => f.replace(/[️\s]+/g, " ").trim())
      .filter((f) => f.length > 2 && f.length < 100)
      .slice(0, 10)

    const services = ["Komplet vše na jednom místě"]
    if (cateringPolicy === "own_free") services.push("Vlastní jídlo a pití bez poplatků")
    if (nightPartyPolicy === "no_curfew") services.push("Bez nočního klidu")

    records.push({
      slug,
      title: v.title,
      description: [v.archType, featuresText.slice(0, 250)].filter(Boolean).join(" — ").slice(0, 600) || `Svatební místo ${v.title}.`,
      location: `${region} kraj${v.nearCity ? ` — ${v.nearCity}` : ""}`,
      region, type,
      capacity: v.capacityNum,
      price_from: parsePrice(v.rental) || 100000,
      services,
      images: [PLACEHOLDERS[imageRot % 10], PLACEHOLDERS[(imageRot + 1) % 10]],
      features,
      is_featured: isVip,
      website_url: v.web || null,
      contact_email: v.email.trim() || null,
      nearest_city: mapNearestCity(v.nearCity),
      accommodation_capacity: 0,
      catering_policy: cateringPolicy,
      night_party_policy: nightPartyPolicy,
      avg_wedding_cost: parsePrice(v.avgCost) || null,
    })
    imageRot += 2
  }

  // Insert po dávkách
  const BATCH = 50
  let inserted = 0
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH)
    const { error } = await supabase.from("venues").insert(batch)
    if (error) {
      console.error(`❌ Chyba u dávky ${i}:`, error.message)
      process.exit(1)
    }
    inserted += batch.length
    process.stdout.write(`\r   ${inserted}/${records.length}`)
  }
  console.log()

  console.log(`\n✅ Nahráno ${inserted} míst`)
  console.log(`⭐ Z toho ${vipCount} VIP (is_featured = true)`)
  console.log("\n🎉 Hotovo! Otevři svou Vercel URL a zkontroluj /chci-svatbu")
}

main().catch((e) => { console.error(e); process.exit(1) })
