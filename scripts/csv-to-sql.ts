/**
 * Vygeneruje SQL INSERT statementy ze CSV.
 * Spuštění: npx tsx scripts/csv-to-sql.ts
 * Výstup: data/venues.sql
 */

import fs from "fs"
import path from "path"

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
          row.push(cell); rows.push(row); row = []; cell = ""
        }
        if (c === "\r" && text[i + 1] === "\n") i++
      } else { cell += c }
    }
  }
  if (cell !== "" || row.length > 0) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((c) => c.trim() !== ""))
}

const slugify = (s: string) => s.toLowerCase().normalize("NFD")
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

function mapType(t: string): string {
  const s = t.toLowerCase()
  if (s.includes("zámek") || s.includes("zámeč") || s.includes("hrad")) return "Zámek"
  if (s.includes("víno") || s.includes("vinař") || s.includes("sklíp") || s.includes("sklep")) return "Vinný sklep"
  if (s.includes("hotel")) return "Hotel"
  if (s.includes("zahrada")) return "Zahrada"
  if (s.includes("mlýn") || s.includes("stodola") || s.includes("statek") || s.includes("dvůr") || s.includes("dvur")) return "Venkovský statek"
  if (s.includes("industriál") || s.includes("loft") || s.includes("hala") || s.includes("továrna")) return "Moderní prostor"
  if (s.includes("fara") || s.includes("klášter") || s.includes("histor") || s.includes("sál")) return "Historická budova"
  if (s.includes("příroda") || s.includes("louka") || s.includes("les") || s.includes("u vody") || s.includes("rybník") || s.includes("samot")) return "Pláž / Příroda"
  return "Historická budova"
}

function parseCapacity(s: string): number {
  if (!s) return 80
  const m = s.match(/\d+/g); if (!m) return 80
  if (s.toLowerCase().includes("nad")) return Number(m[0]) + 50
  return Math.max(...m.map(Number))
}

function parsePrice(s: string): number {
  if (!s) return 100000
  const cleaned = s.replace(/\s/g, "").replace(/[.](?=\d{3})/g, "")
  const m = cleaned.match(/\d+/g); if (!m) return 100000
  const val = Number(m[0])
  if (val < 1000) return val * 1000
  return val
}

function mapAccommodation(s: string): number {
  if (!s) return 0
  if (s.toLowerCase().includes("nemáme")) return 0
  const m = s.match(/\d+/); return m ? Number(m[0]) : 30
}

function mapCatering(s: string): string {
  if (!s) return "negotiable"
  const t = s.toLowerCase()
  if (t.includes("vlastního pití a jídla bez poplatků") || t.includes("vlastní pití a jídla bez poplatků")) return "own_free"
  if (t.includes("vlastní pití") && !t.includes("musí")) return "own_drinks_free"
  if (t.includes("musí")) return "only_venue"
  return "negotiable"
}

function mapNightParty(s: string): string {
  if (!s) return "indoor_after_22"
  const t = s.toLowerCase()
  if (t.includes("nerušíme noční klid")) return "no_curfew"
  if (t.includes("po 22") || t.includes("párty mí") || t.includes("party mí")) return "indoor_after_22"
  return "quiet_hours"
}

function mapNearestCity(s: string): string | null {
  if (!s) return null
  const t = s.toLowerCase()
  if (t.includes("praha") || t.includes("od prahy") || t.includes("v praze")) return "Praha"
  if (t.includes("brno")) return "Brno"
  if (t.includes("budějovic")) return "České Budějovice"
  if (t.includes("plzn") || t.includes("plzeň")) return "Plzeň"
  if (t.includes("hradec")) return "Hradec Králové"
  if (t.includes("ostrav")) return "Ostrava"
  if (t.includes("olomouc")) return "Olomouc"
  if (t.includes("liberec")) return "Liberec"
  return null
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

const sql = (s: string | null | undefined): string => {
  if (s === null || s === undefined || s === "") return "null"
  return `'${String(s).replace(/'/g, "''")}'`
}

const sqlArray = (arr: string[]): string => {
  if (!arr || arr.length === 0) return "ARRAY[]::text[]"
  return `ARRAY[${arr.map((s) => `'${String(s).replace(/'/g, "''")}'`).join(",")}]`
}

function main() {
  const csvPath = path.join(process.cwd(), "data", "venues.csv")
  const text = fs.readFileSync(csvPath, "utf-8")
  const rows = parseCSV(text)
  const header = rows[0].map((h) => h.trim())
  const idx = (name: string) => header.findIndex((h) => h.toLowerCase().includes(name.toLowerCase()))

  const cols = {
    name:     idx("Jméno místa"),
    email:    idx("E-mail"),
    region:   idx("Lokalita - Kraj"),
    nearCity: idx("Lokalita do 90"),
    capacity: idx("Kapacita"),
    type:     idx("Architektonický"),
    accom:    idx("Ubytování"),
    services: idx("Služby nabízené"),
    catering: idx("Catering"),
    party:    idx("Večerní party"),
    features: idx("přidané hodnoty"),
    rental:   idx("pronájem"),
    avgCost:  idx("Kolik u Vás průměrně"),
  }

  console.log("Detekované sloupce:", cols)

  const seenSlugs = new Set<string>()
  const inserts: string[] = []
  let imageRot = 0

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    let title = (r[cols.name] ?? "").trim()
    if (!title || title.length < 2) continue

    let slug = slugify(title)
    if (!slug) continue

    // Vyřeš duplikáty (různé řádky se stejným místem)
    let baseSlug = slug; let counter = 2
    while (seenSlugs.has(slug)) { slug = `${baseSlug}-${counter++}` }
    seenSlugs.add(slug)

    const region = REGION_MAP[(r[cols.region] ?? "").trim()] ?? "Středočeský"
    const type = mapType(r[cols.type] ?? "")
    const capacity = parseCapacity(r[cols.capacity] ?? "")
    const priceFrom = parsePrice(r[cols.rental] ?? "")
    const avgCost = parsePrice(r[cols.avgCost] ?? "0")
    const features = (r[cols.features] ?? "").split(/[,;\n•·]/)
      .map((f) => f.replace(/^[\s\-✔️✓★]+/, "").trim())
      .filter((f) => f.length > 2 && f.length < 80).slice(0, 8)

    const services = ["Komplet vše na jednom místě"]
    if (mapCatering(r[cols.catering] ?? "") === "own_free") services.push("Vlastní jídlo a pití bez poplatků")
    if (mapNightParty(r[cols.party] ?? "") === "no_curfew") services.push("Bez nočního klidu")

    const description = [
      r[cols.type] ?? "",
      ((r[cols.features] ?? "")).slice(0, 200)
    ].filter(Boolean).join(" — ").slice(0, 500) || `Svatební místo ${title}.`

    const images = [
      PLACEHOLDERS[imageRot % PLACEHOLDERS.length],
      PLACEHOLDERS[(imageRot + 1) % PLACEHOLDERS.length],
    ]
    imageRot += 2

    const values = [
      sql(slug), sql(title), sql(description),
      sql(`${region} kraj${r[cols.nearCity] ? ` — ${r[cols.nearCity]}` : ""}`),
      sql(region), sql(type), capacity, priceFrom,
      sqlArray(services), sqlArray(images), sqlArray(features),
      i <= 12 ? "true" : "false",  // prvních 12 jako featured
      "null", // website_url
      sql((r[cols.email] ?? "").trim() || null),
      sql(mapNearestCity(r[cols.nearCity] ?? "")),
      mapAccommodation(r[cols.accom] ?? ""),
      sql(mapCatering(r[cols.catering] ?? "")),
      sql(mapNightParty(r[cols.party] ?? "")),
      avgCost > 0 ? avgCost : "null",
    ]
    inserts.push(`(${values.join(",")})`)
  }

  const out = [
    "-- Hromadný import všech svatebních míst z CSV",
    "-- Vygenerováno automaticky " + new Date().toISOString(),
    "",
    "-- Smaže předchozí pokus (nepovinné)",
    "-- truncate venues cascade;",
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
    "  contact_email = excluded.contact_email,",
    "  nearest_city = excluded.nearest_city,",
    "  accommodation_capacity = excluded.accommodation_capacity,",
    "  catering_policy = excluded.catering_policy,",
    "  night_party_policy = excluded.night_party_policy,",
    "  avg_wedding_cost = excluded.avg_wedding_cost",
    ";",
    "",
  ].join("\n")

  const outPath = path.join(process.cwd(), "data", "venues.sql")
  fs.writeFileSync(outPath, out, "utf-8")
  console.log(`✅ Vygenerováno ${inserts.length} INSERT záznamů → ${outPath}`)
}

main()
