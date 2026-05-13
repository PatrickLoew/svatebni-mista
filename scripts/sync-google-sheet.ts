/**
 * Synchronizace svatebních míst z Google Sheets do Supabase.
 *
 * Použití:  npm run sync-sheet
 *
 * Co dělá:
 *   1. Stáhne CSV z Google Sheets (veřejně dostupná URL)
 *   2. Rozparsuje obě sekce (s ID a bez ID)
 *   3. Dedupne podle názvu a VIP keywordů
 *   4. Smaže staré venues v Supabase a nahraje nové
 */

import fs from "fs"
import path from "path"
import { createClient } from "@supabase/supabase-js"

// Načti .env.local
const envPath = path.join(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8")
  envContent.split("\n").forEach((line) => {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m) process.env[m[1]] = m[2].trim()
  })
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Chybí Supabase env proměnné v .env.local")
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// URL Google Sheets export (změň po nahrazení sheetu)
const SHEET_URL = process.env.GOOGLE_SHEET_URL ||
  "https://docs.google.com/spreadsheets/d/1fxVeCixKlAtbNxAXFPXdqst1UJIft6Tp/export?format=csv&gid=1507971846"

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
  "Beskydy": "Moravskoslezský", "Praha": "Praha", "Slovensko": "Slovensko",
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
  if (!s) return "negotiable"
  const t = s.toLowerCase().trim()

  // 1) Přímé kódy z normalizovaného sloupce (preferované)
  if (t === "own_free" || t.includes("own_free")) return "own_free"
  if (t === "own_drinks_free" || t.includes("own_drinks")) return "own_drinks_free"
  if (t === "only_venue" || t.includes("only_venue")) return "only_venue"
  if (t === "negotiable") return "negotiable"

  // 2) Vlastní jídlo I pití (kompletní vlastní catering bez poplatků)
  if (
    (t.includes("vlastní") && t.includes("jídlo") && t.includes("pití")) ||
    (t.includes("vlastni") && t.includes("jidlo") && t.includes("piti")) ||
    t.includes("vlastní jídlo i pití") ||
    t.includes("vlastní jídlo a pití") ||
    t.includes("vše vlastní") ||
    t.includes("vse vlastni") ||
    (t.includes("vlastní") && t.includes("bez poplatk")) ||
    (t.includes("vlastní") && t.includes("zdarma"))
  ) return "own_free"

  // 3) Pouze vlastní pití (jídlo z místa)
  if (
    t.includes("vlastní pití") ||
    t.includes("vlastni piti") ||
    t.includes("vlastní alkohol") ||
    t.includes("vlastni alkohol") ||
    (t.includes("pití") && t.includes("bez poplatk")) ||
    t.includes("only own drinks")
  ) return "own_drinks_free"

  // 4) Pouze catering od místa / zákaz vlastního
  if (
    t.includes("pouze od místa") ||
    t.includes("pouze od mista") ||
    t.includes("jen od místa") ||
    t.includes("jen od mista") ||
    t.includes("jen catering") ||
    t.includes("povinný") ||
    t.includes("povinny") ||
    t.includes("musí") ||
    t.includes("musi") ||
    t.includes("zákaz vlastn") ||
    t.includes("zakaz vlastn") ||
    t.includes("nelze vlastní") ||
    t.includes("nelze vlastni") ||
    t.includes("nepovolen") ||
    t.includes("v ceně") ||
    t.includes("v cene") ||
    t.includes("povinný catering")
  ) return "only_venue"

  return "negotiable"
}

function mapParty(s: string): string {
  if (!s) return "negotiable"
  const t = s.toLowerCase().trim()

  // 1) Přímé kódy (preferované — Monča může psát rovnou kódy ve sloupci P)
  if (t === "no_curfew" || t.includes("no_curfew")) return "no_curfew"
  if (t === "indoor_after_22" || t.includes("indoor_after_22")) return "indoor_after_22"
  if (t === "quiet_hours" || t.includes("quiet_hours")) return "quiet_hours"
  if (t === "negotiable") return "negotiable"

  // 2) Bez nočního klidu — party může až do rána i venku
  if (
    t.includes("bez nočního") ||
    t.includes("bez nocniho") ||
    t.includes("neruší") ||
    t.includes("nerusi") ||
    t.includes("žádný noční") ||
    t.includes("zadny nocni") ||
    t.includes("bez omezení") ||
    t.includes("bez omezeni") ||
    t.includes("do rána") ||
    t.includes("do rana") ||
    t.includes("celou noc") ||
    t.includes("party do rána")
  ) return "no_curfew"

  // 3) Po 22:00 přesun dovnitř / party místnost
  if (
    t.includes("po 22") ||
    t.includes("přesun") ||
    t.includes("presun") ||
    t.includes("párty místnost") ||
    t.includes("party místnost") ||
    t.includes("party mistnost") ||
    t.includes("uvnitř po") ||
    t.includes("uvnitr po") ||
    t.includes("dovnitř") ||
    t.includes("dovnitr")
  ) return "indoor_after_22"

  // 4) Pouze do 22 / noční klid (party končí v 22:00)
  if (
    t.includes("max do 22") ||
    t.includes("do 22") ||
    t.includes("noční klid") ||
    t.includes("nocni klid") ||
    t.includes("hluku") ||
    t.includes("respektuje") ||
    t.includes("končí") ||
    t.includes("konci") ||
    t.includes("večerka")
  ) return "quiet_hours"

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
  const m = cleaned.match(/\d+/g); if (!m) return 0
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
function normStr(s: string) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") }
function isVipTitle(title: string) {
  const t = normStr(title)
  return VIP_KEYWORDS.some((kw) => t.includes(normStr(kw)))
}
function matchedVipKey(title: string): string | null {
  const t = normStr(title)
  for (const kw of VIP_KEYWORDS) {
    const k = normStr(kw)
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
  console.log("🔗 Stahuji data z Google Sheets...")
  console.log(`   URL: ${SHEET_URL}`)

  const resp = await fetch(SHEET_URL)
  if (!resp.ok) {
    console.error(`❌ Nepodařilo se stáhnout sheet (status ${resp.status})`)
    console.error("   Ujisti se, že je sheet veřejně přístupný (Sdílet → Anyone with link → Viewer)")
    process.exit(1)
  }
  const text = await resp.text()
  console.log(`✓ Staženo ${text.length} znaků`)

  const rows = parseCSV(text)
  console.log(`✓ Rozparsováno ${rows.length} řádků`)

  // Najdi rozdělovník — druhý header
  let splitIdx = rows.length
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0]?.trim() === "Jméno místa") { splitIdx = i; break }
  }

  const newVenues = parseNewFormat(rows, 1, splitIdx)
  const oldVenues = parseOldFormat(rows, splitIdx + 1)
  console.log(`✓ Nový formát: ${newVenues.length} | Starý formát: ${oldVenues.length}`)

  // Dedupe
  const seenNames = new Set<string>()
  const seenVipKeywords = new Set<string>()
  const allVenues: ParsedVenue[] = []
  for (const v of [...oldVenues, ...newVenues]) {
    const normName = normStr(v.title).trim()
    if (seenNames.has(normName)) continue
    const vipKey = matchedVipKey(v.title)
    if (vipKey && seenVipKeywords.has(vipKey)) continue
    seenNames.add(normName)
    if (vipKey) seenVipKeywords.add(vipKey)
    allVenues.push(v)
  }
  console.log(`✓ Unique: ${allVenues.length} míst`)

  console.log("\n🗑  Mažu staré venues v Supabase...")
  const { error: delErr } = await supabase
    .from("venues")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000")
  if (delErr) {
    console.error("❌ Chyba při mazání:", delErr.message)
    process.exit(1)
  }

  console.log("\n📤 Nahrávám do Supabase (po 50)...")
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

    const features = v.features.split(/[,;\n•·✔✓★]/)
      .map((f) => f.replace(/[️\s]+/g, " ").trim())
      .filter((f) => f.length > 2 && f.length < 100)
      .slice(0, 10)

    const services = ["Komplet vše na jednom místě"]
    if (cateringPolicy === "own_free") services.push("Vlastní jídlo a pití bez poplatků")
    if (nightPartyPolicy === "no_curfew") services.push("Bez nočního klidu")

    records.push({
      slug, title: v.title,
      description: [v.archType, v.features.slice(0, 250)].filter(Boolean).join(" — ").slice(0, 600) || `Svatební místo ${v.title}.`,
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

  const BATCH = 50
  let inserted = 0
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH)
    const { error } = await supabase.from("venues").insert(batch)
    if (error) { console.error(`❌ Dávka ${i}: ${error.message}`); process.exit(1) }
    inserted += batch.length
    process.stdout.write(`\r   ${inserted}/${records.length}`)
  }
  console.log()
  console.log(`\n✅ Synchronizováno ${inserted} míst z Google Sheets do Supabase`)
  console.log(`⭐ Z toho ${vipCount} VIP (is_featured = true)`)
  console.log("\n🎉 Hotovo! Otevři svou Vercel URL.")
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1) })
