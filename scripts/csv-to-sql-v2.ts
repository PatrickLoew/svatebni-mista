/**
 * Generátor SQL ze strukturovaného CSV (verze pro „Přehled pro AI agenta").
 *
 * Vstup:  data/venues-v2.csv (CSV s normalizovanými poli)
 * Výstup: data/venues-v2.sql (SQL pro Supabase)
 *
 * Spuštění: npx tsx scripts/csv-to-sql-v2.ts
 */

import fs from "fs"
import path from "path"

/* ──────────── CSV parser ──────────── */

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

/* ──────────── HELPERS ──────────── */

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
  "Slovensko": "Slovensko", "Evropské státy": "Slovensko",
}

const ARCH_TYPE_MAP: Record<string, string> = {
  "Zámek": "Zámek",
  "Hrad": "Zámek",
  "Hotelový styl": "Hotel",
  "Mlýn, stodola, statek": "Venkovský statek",
  "Industriál (hala, továrna, loft)": "Moderní prostor",
  "Příroda (louka, les, u vody)": "Pláž / Příroda",
  "Zajímavé místo / unikát": "Historická budova",
}

function normalizeType(typeText: string): string {
  // Zkus přesný mapping
  if (ARCH_TYPE_MAP[typeText.trim()]) return ARCH_TYPE_MAP[typeText.trim()]
  // Fuzzy mapping
  const t = typeText.toLowerCase()
  if (t.includes("zámek") || t.includes("zámeč")) return "Zámek"
  if (t.includes("hrad")) return "Zámek"
  if (t.includes("hotel")) return "Hotel"
  if (t.includes("víno") || t.includes("vinař") || t.includes("sklep") || t.includes("sklíp")) return "Vinný sklep"
  if (t.includes("mlýn") || t.includes("stodola") || t.includes("statek") || t.includes("dvůr")) return "Venkovský statek"
  if (t.includes("industriál") || t.includes("loft") || t.includes("továrna") || t.includes("hala")) return "Moderní prostor"
  if (t.includes("příroda") || t.includes("louka") || t.includes("les") || t.includes("u vody") || t.includes("samot")) return "Pláž / Příroda"
  if (t.includes("klášter") || t.includes("fara") || t.includes("histor")) return "Historická budova"
  return "Historická budova"
}

// Z normalizovaného textu → DB enum
function mapAccommodation(normalized: string): number {
  // "ano, přímo v místě" / "ano, v okolí" / "ne"
  const t = normalized.toLowerCase()
  if (t.includes("přímo") || t.includes("primo")) return 40
  if (t.includes("v okolí") || t.includes("okoli")) return 0
  return 0
}

function mapAccommodationCount(text: string): number {
  // Zkus vyparsovat číslo z textu kapacity ubytování
  if (!text) return 0
  const m = text.match(/\d+/)
  return m ? Number(m[0]) : 0
}

function mapCatering(normalized: string): string {
  const t = normalized.toLowerCase()
  if (t.includes("vlastní jídlo") || t.includes("vlastní jídlo/pití")) return "own_free"
  if (t.includes("vlastní pití")) return "own_drinks_free"
  if (t.includes("povinný") || t.includes("musí")) return "only_venue"
  return "negotiable"
}

function mapParty(normalized: string): string {
  const t = normalized.toLowerCase()
  if (t.includes("bez nočního") || t.includes("neruší")) return "no_curfew"
  if (t.includes("po 22") || t.includes("přesun")) return "indoor_after_22"
  if (t.includes("max do 22") || t.includes("do 22")) return "quiet_hours"
  return "negotiable"
}

function mapNearestCity(text: string): string | null {
  if (!text) return null
  const t = text.toLowerCase()
  if (t.includes("praha") || t.includes("od prahy")) return "Praha"
  if (t.includes("brno")) return "Brno"
  if (t.includes("budějovic")) return "České Budějovice"
  if (t.includes("plzn") || t.includes("plzeň")) return "Plzeň"
  if (t.includes("hradec")) return "Hradec Králové"
  if (t.includes("ostrav")) return "Ostrava"
  if (t.includes("olomouc")) return "Olomouc"
  if (t.includes("liberec")) return "Liberec"
  return null
}

function parsePrice(s: string): number {
  if (!s) return 0
  const cleaned = s.replace(/\s/g, "").replace(/[.](?=\d{3})/g, "")
  const m = cleaned.match(/\d+/g)
  if (!m) return 0
  const val = Number(m[0])
  if (val < 1000) return val * 1000
  return val
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

// 22 VIP klíčových slov — kdykoli název obsahuje jedno z nich, místo je VIP
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

const sql = (s: string | null | undefined): string => {
  if (s === null || s === undefined || s === "") return "null"
  return `'${String(s).replace(/'/g, "''")}'`
}

const sqlArray = (arr: string[]): string => {
  if (!arr || arr.length === 0) return "ARRAY[]::text[]"
  return `ARRAY[${arr.map((s) => `'${String(s).replace(/'/g, "''")}'`).join(",")}]`
}

/* ──────────── HLAVNÍ FUNKCE ──────────── */

function main() {
  const csvPath = path.join(process.cwd(), "data", "venues-v2.csv")
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Soubor ${csvPath} neexistuje.`)
    process.exit(1)
  }
  const text = fs.readFileSync(csvPath, "utf-8")
  const rows = parseCSV(text)
  const header = rows[0].map((h) => h.trim())

  // Najdi sloupce dle headeru
  const col = (name: string) => header.findIndex((h) => h.toLowerCase().includes(name.toLowerCase()))
  const cols = {
    id:           col("ID"),
    name:         col("Jméno místa"),
    email:        col("E-mail"),
    web:          col("Webová stránka"),
    region:       col("Lokalita - kraj"),
    nearCity:     col("Lokalita do 90"),
    capacityText: col("Kapacita text"),
    capacityMax:  col("Kapacita max"),
    archType:     col("Architektonický typ"),
    accommodation:    col("Ubytování"),
    accomNormalized:  col("Ubytování normalizace"),
    services:     col("Služby místa"),
    catering:     col("Catering a pití"),
    cateringNorm: col("Catering normalizace"),
    party:        col("Večerní party"),
    partyNorm:    col("Party normalizace"),
    features:     col("Přidané hodnoty"),
    rental:       col("Pronájem"),
    avgCost:      col("Průměrná cena svatby"),
    note:         col("Další poznámka"),
  }
  console.log("📋 Detekované sloupce:", cols)

  const seenSlugs = new Set<string>()
  const inserts: string[] = []
  let imageRot = 0
  let vipCount = 0

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const title = (r[cols.name] ?? "").trim()
    if (!title || title.length < 2) continue

    let slug = slugify(title)
    if (!slug) continue
    let baseSlug = slug; let counter = 2
    while (seenSlugs.has(slug)) { slug = `${baseSlug}-${counter++}` }
    seenSlugs.add(slug)

    const region = REGION_MAP[(r[cols.region] ?? "").trim()] ?? "Středočeský"
    const type = normalizeType(r[cols.archType] ?? "")
    const capacity = Number(r[cols.capacityMax]) || 80
    const rentalPrice = parsePrice(r[cols.rental] ?? "")
    const avgPrice = parsePrice(r[cols.avgCost] ?? "")
    const accomCount = mapAccommodationCount(r[cols.accommodation] ?? "")
    const cateringPolicy = mapCatering(r[cols.cateringNorm] ?? "")
    const nightPartyPolicy = mapParty(r[cols.partyNorm] ?? "")

    // Rozparsuj features
    const featuresText = (r[cols.features] ?? "").trim()
    const features = featuresText
      .split(/[,;\n•·✔️✓★]/)
      .map((f) => f.trim())
      .filter((f) => f.length > 2 && f.length < 100)
      .slice(0, 10)

    // Sestaviv services array (kombinace info)
    const services = ["Komplet vše na jednom místě"]
    if (cateringPolicy === "own_free") services.push("Vlastní jídlo a pití bez poplatků")
    if (nightPartyPolicy === "no_curfew") services.push("Bez nočního klidu")
    if (accomCount > 0) services.push(`Ubytování pro ${accomCount} hostů`)

    // Description
    const description = [
      r[cols.archType] ?? "",
      featuresText.slice(0, 250),
    ].filter(Boolean).join(" — ").slice(0, 600) || `Svatební místo ${title}.`

    // Images — placeholders
    const images = [
      PLACEHOLDERS[imageRot % PLACEHOLDERS.length],
      PLACEHOLDERS[(imageRot + 1) % PLACEHOLDERS.length],
    ]
    imageRot += 2

    const isVip = isVipTitle(title)
    if (isVip) vipCount++

    const values = [
      sql(slug), sql(title), sql(description),
      sql(`${region} kraj${r[cols.nearCity] ? ` — ${r[cols.nearCity]}` : ""}`),
      sql(region), sql(type), capacity, rentalPrice || 100000,
      sqlArray(services), sqlArray(images), sqlArray(features),
      isVip ? "true" : "false",  // is_featured
      sql(r[cols.web] ?? null),
      sql((r[cols.email] ?? "").trim() || null),
      sql(mapNearestCity(r[cols.nearCity] ?? "")),
      accomCount,
      sql(cateringPolicy),
      sql(nightPartyPolicy),
      avgPrice > 0 ? avgPrice : "null",
    ]
    inserts.push(`(${values.join(",")})`)
  }

  const out = [
    "-- Hromadný import všech svatebních míst z Přehled pro AI agenta.csv",
    `-- Vygenerováno automaticky ${new Date().toISOString()}`,
    `-- Celkem: ${inserts.length} míst, VIP: ${vipCount}`,
    "",
    "-- Smaž stará data (volitelné)",
    "-- delete from venues;",
    "",
    "insert into venues (",
    "  slug, title, description, location, region, type, capacity, price_from,",
    "  services, images, features, is_featured,",
    "  website_url, contact_email, nearest_city, accommodation_capacity,",
    "  catering_policy, night_party_policy, avg_wedding_cost",
    ") values",
    inserts.join(",\n"),
    "on conflict (slug) do update set",
    "  title = excluded.title,",
    "  description = excluded.description,",
    "  location = excluded.location,",
    "  region = excluded.region,",
    "  type = excluded.type,",
    "  capacity = excluded.capacity,",
    "  price_from = excluded.price_from,",
    "  services = excluded.services,",
    "  features = excluded.features,",
    "  is_featured = excluded.is_featured,",
    "  website_url = excluded.website_url,",
    "  contact_email = excluded.contact_email,",
    "  nearest_city = excluded.nearest_city,",
    "  accommodation_capacity = excluded.accommodation_capacity,",
    "  catering_policy = excluded.catering_policy,",
    "  night_party_policy = excluded.night_party_policy,",
    "  avg_wedding_cost = excluded.avg_wedding_cost",
    ";",
    "",
  ].join("\n")

  const outPath = path.join(process.cwd(), "data", "venues-v2.sql")
  fs.writeFileSync(outPath, out, "utf-8")
  console.log(`\n✅ Vygenerováno ${inserts.length} míst → ${outPath}`)
  console.log(`⭐ Z toho ${vipCount} VIP (is_featured = true)`)
}

main()
