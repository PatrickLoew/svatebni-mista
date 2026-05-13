/**
 * Aktualizace VIP míst v Supabase z Mončina CSV (single source of truth).
 *
 * Vstup: data/vip-master.csv (22 VIP míst se všemi sloupci)
 *
 * Aktualizuje VŠECHNA pole VIP míst:
 *  - region, nearest_city, type
 *  - catering_policy, night_party_policy
 *  - capacity, accommodation_capacity
 *  - description, features, services
 *  - website_url, contact_email
 *  - price_from, avg_wedding_cost
 *  - is_featured = true (vždy)
 *
 * Bezpečné: nemaže, jen upravuje existující záznamy.
 * Pokud místo v DB nenajde, vytvoří nové.
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

const CSV_PATH = path.join(process.cwd(), "data", "vip-master.csv")

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

/* ─────────── Mapování ─────────── */

const REGION_MAP: Record<string, string> = {
  "Jihočeský": "Jihočeský",
  "Středočeský kraj": "Středočeský",
  "Středočeský": "Středočeský",
  "Ústecký kraj": "Ústecký",
  "Ústecký": "Ústecký",
  "Liberecký Kraj": "Liberecký",
  "Liberecký": "Liberecký",
  "Olomoucký kraj": "Moravskoslezský",  // Patrikova oprava: Štáblovice u Opavy = MSK
  "Beskydy": "Moravskoslezský",
  "Jihomoravský": "Jihomoravský",
  "Vysočina": "Vysočina",
  "Hradecký kraj": "Královéhradecký",
  "Královéhradecký": "Královéhradecký",
  "Moravskoslezský": "Moravskoslezský",
  "Slovensko": "Slovensko",
}

const CITY_MAP: Record<string, string> = {
  "od Českých Budějovic": "České Budějovice",
  "České Budějovice": "České Budějovice",
  "Praha": "Praha",
  "Praha 30 min od Prahy": "Praha",
  "od Prahy": "Praha",
  "30 min od Brna": "Brno",
  "Brno": "Brno",
  "Olomouc": "Olomouc",
  "Ostrava": "Ostrava",
  "Hradec Králové": "Hradec Králové",
  "Liberec": "Liberec",
  "Plzeň": "Plzeň",
}

function detectCity(raw: string, region: string): string {
  const t = raw.trim()
  if (CITY_MAP[t]) return CITY_MAP[t]
  // Pokud obsahuje známá města
  if (t.toLowerCase().includes("brno")) return "Brno"
  if (t.toLowerCase().includes("praha")) return "Praha"
  if (t.toLowerCase().includes("ostrava")) return "Ostrava"
  if (t.toLowerCase().includes("olomouc")) return "Olomouc"
  if (t.toLowerCase().includes("budějovic")) return "České Budějovice"
  if (t.toLowerCase().includes("hradec")) return "Hradec Králové"
  if (t.toLowerCase().includes("liberec")) return "Liberec"
  if (t.toLowerCase().includes("plzeň") || t.toLowerCase().includes("plzen")) return "Plzeň"
  // Fallback z kraje
  const fb: Record<string, string> = {
    "Jihočeský": "České Budějovice", "Praha": "Praha", "Středočeský": "Praha",
    "Ústecký": "Praha", "Liberecký": "Liberec", "Královéhradecký": "Hradec Králové",
    "Pardubický": "Hradec Králové", "Plzeňský": "Plzeň", "Karlovarský": "Plzeň",
    "Vysočina": "Brno", "Jihomoravský": "Brno", "Olomoucký": "Olomouc",
    "Zlínský": "Ostrava", "Moravskoslezský": "Ostrava", "Slovensko": "Ostrava",
  }
  return fb[region] ?? "Praha"
}

function detectType(archType: string, title: string): string {
  const s = `${archType} ${title}`.toLowerCase()
  if (s.includes("zámek") || s.includes("zameck") || s.includes("zámeč") || s.includes("hrad") || s.includes("chateau") || s.includes("château")) return "Zámek"
  if (s.includes("vinný") || s.includes("vinař") || s.includes("sklep")) return "Vinný sklep"
  if (s.includes("klášter") || s.includes("klaster") || s.includes("fara") || s.includes("histor") || s.includes("tvrz") || s.includes("vila") || s.includes("villa")) return "Historická budova"
  if (s.includes("statek") || s.includes("mlýn") || s.includes("stodola") || s.includes("dvůr") || s.includes("ranč") || s.includes("ranch") || s.includes("farma")) return "Venkovský statek"
  if (s.includes("loft") || s.includes("hala") || s.includes("industriál") || s.includes("továrn") || s.includes("moderní")) return "Moderní prostor"
  if (s.includes("příroda") || s.includes("louka") || s.includes("les") || s.includes("u vody") || s.includes("samot") || s.includes("srub")) return "Pláž / Příroda"
  if (s.includes("hotel") || s.includes("resort") || s.includes("penzion")) return "Hotel"
  return "Historická budova"
}

function mapCatering(s: string): string {
  if (!s) return "negotiable"
  const t = s.toLowerCase().trim()

  // "vlastní jídlo a pití bez poplatků" / "Jídlo a pití vlastní bez poplatků"
  // "Snoubenci mají možnost vlastního pití a jídla bez poplatků"
  if (
    (t.includes("vlastní") && t.includes("jídlo") && t.includes("pití") && t.includes("bez poplatk")) ||
    (t.includes("jídlo") && t.includes("pití") && t.includes("vlastní") && t.includes("bez poplatk")) ||
    t.includes("vlastního pití a jídla bez poplatk")
  ) return "own_free"

  // "Vlastní pití snoubenců bez poplatků, zajistíme catering"
  if (t.includes("vlastní pití") && !t.includes("jídlo")) return "own_drinks_free"

  // "Vše od nás" / "Snoubenci musí mít catering a pití od nás"
  if (
    t === "vše od nás" || t === "vse od nas" ||
    t.includes("musí mít catering") || t.includes("musi mit catering") ||
    t.includes("catering a pití od nás") ||
    t.includes("catering od nás") || t.includes("catering od nas") ||
    t === "vše od nás " || t.trim() === "vše od nás"
  ) return "only_venue"

  // "Dle domluvy"
  if (t === "dle domluvy") return "negotiable"

  return "negotiable"
}

function mapParty(s: string): string {
  if (!s) return "negotiable"
  const t = s.toLowerCase().trim()

  // "Máme místo, kde nerušíme noční klid" / "Žádný noční klid" / "Nerušíme noční klid"
  if (
    t.includes("nerušíme noční klid") || t.includes("nerusime nocni klid") ||
    t.includes("žádný noční klid") || t.includes("zadny nocni klid")
  ) return "no_curfew"

  // "po 22.00 party místnost" / "Party možná i po 22.00, pouze s přesunem do párty místnosti"
  // / "Pokud mají rezervovaný dostatek pokojů v hotelu, může být i po 22 hodině"
  if (
    (t.includes("po 22") && (t.includes("party místn") || t.includes("party mistn") || t.includes("párty místn") || t.includes("přesun") || t.includes("presun"))) ||
    t.includes("po 22.00 party místnost") ||
    (t.includes("po 22") && t.includes("hotelu"))
  ) return "indoor_after_22"

  return "negotiable"
}

function parseCapacity(s: string): number {
  if (!s) return 80
  const m = s.match(/\d+/g)
  if (!m) return 80
  return Number(m[0])
}

function parseAccomodation(s: string): number {
  if (!s) return 0
  const t = s.toLowerCase()
  if (t.includes("okolí") || t.includes("okoli")) return 0
  // "20+30", "20 + 30", "60 osob", "do 100"
  const numbers = s.match(/\d+/g)
  if (!numbers) return 0
  if (numbers.length === 1) return Number(numbers[0])
  // Sečíst čísla (např. 20+30 = 50)
  return numbers.map(Number).reduce((a, b) => a + b, 0)
}

function parsePrice(s: string): number {
  if (!s) return 0
  const cleaned = s.replace(/\s/g, "").replace(/[.,](?=\d{3})/g, "")
  const m = cleaned.match(/\d+/)
  if (!m) return 0
  const val = Number(m[0])
  return val < 1000 ? val * 1000 : val
}

function parseEmailAndWeb(s: string): { email: string | null; web: string | null } {
  if (!s) return { email: null, web: null }
  const emailMatch = s.match(/[\w.+-]+@[\w.-]+\.\w+/)
  const webMatch = s.match(/https?:\/\/[^\s,]+/)
  return {
    email: emailMatch?.[0]?.trim() ?? null,
    web: webMatch?.[0]?.trim() ?? null,
  }
}

function parseFeatures(addedValue: string, services: string): string[] {
  const all = `${addedValue} ${services}`.toLowerCase()
  const out: string[] = []
  if (all.includes("wellness")) out.push("Wellness")
  if (all.includes("bazén") || all.includes("biotop") || all.includes("koupací")) out.push("Bazén / biotop")
  if (all.includes("sauna")) out.push("Sauna")
  if (all.includes("pes") || all.includes("pej") || all.includes("psy") || all.includes("psí") || all.includes("pet")) out.push("Pejsek vítán")
  if (all.includes("rybníček") || all.includes("rybníky") || all.includes("rybník") || all.includes("jezírk") || all.includes("u vody")) out.push("U vody / rybník")
  if (all.includes("hřiště") || all.includes("dětsk")) out.push("Dětské hřiště")
  if (all.includes("luxusní ubytování")) out.push("Luxusní ubytování")
  if (all.includes("luxusní")) out.push("Luxus")
  if (all.includes("samot")) out.push("Soukromý areál / samota")
  if (all.includes("zahrada")) out.push("Zahrada")
  if (all.includes("stodola")) out.push("Stodola")
  if (all.includes("výzdoba")) out.push("Výzdoba v ceně")
  if (all.includes("hory") || all.includes("horský") || all.includes("výhled")) out.push("Horský výhled")
  if (all.includes("francie") || all.includes("rokoko")) out.push("Elegantní interiér")
  return [...new Set(out)].slice(0, 8)
}

function buildDescription(archType: string, addedValue: string, services: string, capacity: string): string {
  const parts: string[] = []
  if (archType) parts.push(archType.trim())
  if (services && !services.toLowerCase().includes("jednom místě")) parts.push(services.trim())
  if (addedValue) parts.push(addedValue.trim())
  return parts.filter(Boolean).join(" — ").slice(0, 1000) || `Svatební VIP místo.`
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const normStr = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim()

/* ─────────── HLAVNÍ ─────────── */

interface ParsedVip {
  title: string
  email: string | null
  web: string | null
  region: string
  nearestCity: string
  capacity: number
  type: string
  accommodationCapacity: number
  cateringPolicy: string
  nightPartyPolicy: string
  features: string[]
  description: string
  priceFrom: number
  avgCost: number
}

async function main() {
  console.log("📂 Načítám VIP CSV...")
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ CSV nenalezeno: ${CSV_PATH}`)
    process.exit(1)
  }
  const csv = fs.readFileSync(CSV_PATH, "utf-8")
  const rows = parseCSV(csv)
  console.log(`✓ Rozparsováno ${rows.length} řádků (vč. headeru)\n`)

  // Hlavička je řádek 0
  const parsed: ParsedVip[] = []
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const title = (r[0] ?? "").trim()
    if (!title) continue

    // Některé řádky mají poznámku místo dat (Zámek Blatná: "Na tohle místo teprve pojedeme")
    const region = r[2] ?? ""
    if (!region.trim() || region.toLowerCase().includes("teprve pojedeme")) {
      console.log(`⏭  Přeskočeno: ${title} (poznámka místo dat)`)
      continue
    }

    const { email, web } = parseEmailAndWeb(r[1] ?? "")
    const mappedRegion = REGION_MAP[region.trim()] ?? "Středočeský"
    const nearestCity = detectCity(r[3] ?? "", mappedRegion)
    const archType = r[5] ?? ""

    const v: ParsedVip = {
      title,
      email,
      web,
      region: mappedRegion,
      nearestCity,
      capacity: parseCapacity(r[4] ?? ""),
      type: detectType(archType, title),
      accommodationCapacity: parseAccomodation(r[6] ?? ""),
      cateringPolicy: mapCatering(r[8] ?? ""),
      nightPartyPolicy: mapParty(r[9] ?? ""),
      features: parseFeatures(r[10] ?? "", r[7] ?? ""),
      description: buildDescription(archType, r[10] ?? "", r[7] ?? "", r[4] ?? ""),
      priceFrom: parsePrice(r[11] ?? ""),
      avgCost: parsePrice(r[12] ?? ""),
    }

    // PATRIKOVA RUČNÍ OVERRIDE (mají prioritu nad CSV)
    const tn = normStr(title)
    if (tn.includes("stablovice") || tn.includes("štáblovice")) {
      v.region = "Moravskoslezský"
      v.nearestCity = "Ostrava"
      v.type = "Zámek"
    }
    if (tn.includes("tereza")) {
      v.region = "Ústecký"
      v.nearestCity = "Praha"
    }
    if (tn.includes("varvazov") || tn.includes("varvažov") || tn.includes("stara posta") || tn.includes("stará pošta")) {
      v.region = "Ústecký"
      v.nearestCity = "Praha"
    }
    if (tn.includes("smrciny") || tn.includes("smrčiny")) {
      v.region = "Vysočina"
      v.nearestCity = "Brno"
    }
    if (tn.includes("karlovka")) {
      v.region = "Královéhradecký"
      v.nearestCity = "Hradec Králové"
    }
    if (tn.includes("ranc telc") || tn.includes("ranč telč")) {
      v.region = "Vysočina"
      v.nearestCity = "Brno"
    }
    if (tn.includes("cerhu") || tn.includes("cerhů") || tn.includes("knezmost") || tn.includes("kněžmost")) {
      v.region = "Středočeský"
      v.nearestCity = "Praha"
    }
    if (tn.includes("garden u holubu") || tn.includes("garden u holubů")) {
      v.region = "Moravskoslezský"
      v.nearestCity = "Ostrava"
      v.type = "Hotel"
    }

    parsed.push(v)
  }

  console.log(`📊 ${parsed.length} VIP míst k aktualizaci\n`)

  // Načti existující venues pro hledání
  const { data: allVenues, error } = await supabase
    .from("venues")
    .select("id, slug, title")
  if (error) { console.error("❌", error.message); process.exit(1) }

  const venueByTitle = new Map<string, { id: string; slug: string }>()
  for (const v of allVenues ?? []) {
    venueByTitle.set(normStr(v.title), { id: v.id, slug: v.slug })
  }

  // Aktualizovat každé VIP
  let updated = 0
  let created = 0

  for (const v of parsed) {
    const titleN = normStr(v.title)

    // Najít v DB (přesný název, pak fuzzy match)
    let existing = venueByTitle.get(titleN)
    if (!existing) {
      // Fuzzy: hledáme klíčové slovo
      for (const [k, val] of venueByTitle.entries()) {
        if (k.includes(titleN.substring(0, Math.min(8, titleN.length))) || titleN.includes(k.substring(0, Math.min(8, k.length)))) {
          existing = val
          break
        }
      }
    }

    const services = []
    if (v.cateringPolicy === "own_free") services.push("Vlastní jídlo a pití bez poplatků")
    if (v.cateringPolicy === "own_drinks_free") services.push("Vlastní pití bez poplatků")
    if (v.nightPartyPolicy === "no_curfew") services.push("Bez nočního klidu")
    services.push("Komplet vše na jednom místě")

    const payload = {
      title: v.title,
      description: v.description,
      location: `${v.region} kraj`,
      region: v.region,
      type: v.type,
      capacity: v.capacity,
      price_from: v.priceFrom || 100000,
      services,
      features: v.features,
      is_featured: true,
      website_url: v.web,
      contact_email: v.email,
      nearest_city: v.nearestCity,
      accommodation_capacity: v.accommodationCapacity,
      catering_policy: v.cateringPolicy,
      night_party_policy: v.nightPartyPolicy,
      avg_wedding_cost: v.avgCost || null,
    }

    if (existing) {
      const { error: updErr } = await supabase.from("venues").update(payload).eq("id", existing.id)
      if (updErr) {
        console.error(`❌ ${v.title}: ${updErr.message}`)
      } else {
        console.log(`✓ Aktualizováno: ${v.title}`)
        console.log(`   region: ${v.region} | typ: ${v.type} | město: ${v.nearestCity}`)
        console.log(`   catering: ${v.cateringPolicy} | party: ${v.nightPartyPolicy}`)
        console.log(`   ubytování: ${v.accommodationCapacity} lůžek | kapacita: ${v.capacity}`)
        console.log(`   features: ${v.features.join(", ")}`)
        updated++
      }
    } else {
      // Vytvořit nový (neexistuje v DB)
      const slug = slugify(v.title)
      const PLACEHOLDERS = [
        "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1600&q=85",
        "https://images.unsplash.com/photo-1505932794465-147d1f1b2c97?w=1600&q=85",
      ]
      const newRecord = {
        ...payload,
        slug,
        images: PLACEHOLDERS,
      }
      const { error: insErr } = await supabase.from("venues").insert([newRecord])
      if (insErr) {
        console.error(`❌ ${v.title} (nový): ${insErr.message}`)
      } else {
        console.log(`✨ NOVÝ: ${v.title}`)
        created++
      }
    }
  }

  console.log("\n" + "═".repeat(70))
  console.log(`✅ HOTOVO: ${updated} aktualizováno, ${created} vytvořeno`)
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1) })
