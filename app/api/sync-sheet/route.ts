/**
 * Automatická synchronizace Google Sheet → Supabase.
 *
 * 1. Stáhne aktuální CSV z Google Sheets
 * 2. Pro každé místo: pokud existuje v DB (podle slugu z názvu), update;
 *    pokud neexistuje, insert (jen pokud má vyplněný název)
 * 3. NEZAHAZUJE existující VIP data ani manuální opravy
 * 4. Revaliduje stránky (/, /venues, /chci-svatbu)
 *
 * Volá se:
 *  A) Vercel Cron Job (každý den v 6:00 ráno) — viz vercel.json
 *  B) Admin tlačítko v /admin
 *  C) Ručně přes curl s tokenem (CRON_SECRET)
 *
 * Bezpečnost: vyžaduje header `Authorization: Bearer <CRON_SECRET>`
 */
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase"

const SHEET_URL = process.env.GOOGLE_SHEET_URL ||
  "https://docs.google.com/spreadsheets/d/1PMZYxRFSOJ7K0fCSHY7pnfEJCuDvmVL0/export?format=csv&gid=1539060920"

/* ─────────── helper functions (stejné mapování jako sync-google-sheet) ─────────── */

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

const normStr = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim()

function mapCatering(s: string): string {
  if (!s) return "negotiable"
  const t = s.toLowerCase().trim()
  if (t === "povinný interní catering/pití") return "only_venue"
  if (t === "vlastní jídlo/pití bez poplatků") return "own_free"
  if (t === "dle domluvy" || t === "ověřit detail") return "negotiable"
  if (t.includes("vlastní") && t.includes("jídlo") && t.includes("pití")) return "own_free"
  if (t.includes("musí mít catering") || t.includes("vše od nás") || t.includes("povinný")) return "only_venue"
  if (t.includes("vlastní pití") && !t.includes("jídlo")) return "own_drinks_free"
  return "negotiable"
}

function mapParty(s: string): string {
  if (!s) return "negotiable"
  const t = s.toLowerCase().trim()
  if (t === "po 22:00 s přesunem dovnitř") return "indoor_after_22"
  if (t === "bez nočního limitu / neruší okolí") return "no_curfew"
  if (t === "možné po 22:00 dle podmínek") return "indoor_after_22"
  if (t === "nevyplněno" || t === "ověřit detail") return "negotiable"
  if (t.includes("nerušíme noční klid") || t.includes("žádný noční klid")) return "no_curfew"
  if (t.includes("po 22")) return "indoor_after_22"
  if (t.includes("max do 22")) return "quiet_hours"
  return "negotiable"
}

function parseAccommodation(s: string): number {
  if (!s) return 0
  const t = s.toLowerCase().trim()
  if (t.includes("okolí") || t === "ne") return 0
  const numbers = s.match(/\d+/g)
  if (!numbers) return t.includes("ano") ? 30 : 0
  return numbers.map(Number).reduce((a, b) => a + b, 0)
}

function parsePrice(s: string): number {
  if (!s) return 0
  const cleaned = s.replace(/\s/g, "").replace(/[.](?=\d{3})/g, "")
  const m = cleaned.match(/\d+/g)
  if (!m) return 0
  const val = Number(m[0])
  return val < 1000 ? val * 1000 : val
}

function normalizeType(archType: string, title = ""): string {
  const s = `${archType} ${title}`.toLowerCase()
  if (s.includes("zámek") || s.includes("château")) return "Zámek"
  if (s.includes("vinný") || s.includes("vinař") || s.includes("sklep")) return "Vinný sklep"
  if (s.includes("hotel") || s.includes("resort") || s.includes("penzion")) return "Hotel"
  if (s.includes("mlýn") || s.includes("stodola") || s.includes("statek") || s.includes("dvůr") || s.includes("ranč")) return "Venkovský statek"
  if (s.includes("loft") || s.includes("industriál")) return "Moderní prostor"
  if (s.includes("louka") || s.includes("příroda") || s.includes("samot")) return "Pláž / Příroda"
  return "Historická budova"
}

const REGION_MAP: Record<string, string> = {
  "Středočeský": "Středočeský", "Jihočeský": "Jihočeský",
  "Plzeňský": "Plzeňský", "Karlovarský": "Karlovarský",
  "Ústecký": "Ústecký", "Liberecký": "Liberecký",
  "Královohradecký": "Královéhradecký", "Královéhradecký": "Královéhradecký",
  "Pardubický": "Pardubický", "Vysočina": "Vysočina",
  "Jihomoravský": "Jihomoravský", "Olomoucký": "Olomoucký",
  "Zlínský": "Zlínský", "Moravskoslezský": "Moravskoslezský",
  "Praha": "Praha", "Slovensko": "Slovensko",
}

function inferNearestCity(region: string): string | null {
  const map: Record<string, string> = {
    "Praha": "Praha", "Středočeský": "Praha", "Ústecký": "Praha",
    "Liberecký": "Liberec", "Královéhradecký": "Hradec Králové",
    "Pardubický": "Hradec Králové", "Plzeňský": "Plzeň",
    "Karlovarský": "Plzeň", "Jihočeský": "České Budějovice",
    "Vysočina": "Brno", "Jihomoravský": "Brno",
    "Zlínský": "Ostrava", "Olomoucký": "Olomouc",
    "Moravskoslezský": "Ostrava",
  }
  return map[region] ?? null
}

/* ─────────── HLAVNÍ HANDLER ─────────── */

async function authorizeRequest(req: Request): Promise<boolean> {
  // Vercel Cron volá s header Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get("authorization")
  const expectedToken = process.env.CRON_SECRET
  if (!expectedToken) {
    // Pokud CRON_SECRET není nastavený, povolit jen lokálně
    return process.env.NODE_ENV === "development"
  }
  return authHeader === `Bearer ${expectedToken}`
}

export async function GET(req: Request) {
  // Vercel Cron volá GET
  if (!(await authorizeRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return runSync()
}

export async function POST(req: Request) {
  // Admin tlačítko volá POST se stejným tokenem (z env)
  if (!(await authorizeRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return runSync()
}

async function runSync(): Promise<NextResponse> {
  const startTime = Date.now()
  console.log("[sync-sheet] Spouštím synchronizaci...")

  try {
    // 1. Stáhnout sheet
    const resp = await fetch(SHEET_URL)
    if (!resp.ok) {
      return NextResponse.json(
        { error: `Nelze stáhnout sheet (${resp.status})` },
        { status: 500 },
      )
    }
    const text = await resp.text()
    const rows = parseCSV(text)

    // 2. Najít split mezi novým a starým formátem (pokud existuje)
    let splitIdx = rows.length
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0]?.trim() === "Jméno místa") { splitIdx = i; break }
    }

    // 3. Načíst existující venues z DB
    const { data: existingVenues } = await supabaseAdmin
      .from("venues")
      .select("id, title, slug, is_featured")
    const existingByTitle = new Map<string, { id: string; isFeatured: boolean }>()
    for (const v of existingVenues ?? []) {
      existingByTitle.set(normStr(v.title), { id: v.id, isFeatured: v.is_featured })
    }

    // 4. Pro každý řádek: update nebo insert
    let updated = 0
    let inserted = 0
    let skipped = 0
    let skippedVip = 0

    const processRow = async (
      title: string,
      region: string,
      capacity: string,
      archType: string,
      accommodation: string,
      catering: string,
      cateringNorm: string,
      party: string,
      partyNorm: string,
      features: string,
      email: string,
      web: string,
      rentalPrice: string,
    ) => {
      if (!title || title.includes("http") || title.includes("@")) return

      const titleN = normStr(title)
      const existing = existingByTitle.get(titleN)

      // VIP místa nepřepisujeme — mají data z vip-master.csv + manuální opravy
      if (existing?.isFeatured) {
        skippedVip++
        return
      }

      const mappedRegion = REGION_MAP[region.trim()] ?? "Středočeský"
      const payload = {
        title: title.trim(),
        region: mappedRegion,
        nearest_city: inferNearestCity(mappedRegion),
        type: normalizeType(archType, title),
        capacity: Number(capacity.match(/\d+/)?.[0] ?? 80),
        accommodation_capacity: parseAccommodation(accommodation),
        catering_policy: mapCatering(cateringNorm || catering),
        night_party_policy: mapParty(partyNorm || party),
        price_from: parsePrice(rentalPrice) || 100000,
        contact_email: email.trim() || null,
        website_url: web.trim() || null,
        description: [archType, features.slice(0, 250)].filter(Boolean).join(" — ").slice(0, 600),
      }

      if (existing) {
        const { error } = await supabaseAdmin.from("venues").update(payload).eq("id", existing.id)
        if (!error) updated++
        else { console.error(`Update error ${title}:`, error.message); skipped++ }
      } else {
        const slug = slugify(title)
        const newRecord = {
          ...payload,
          slug,
          services: ["Komplet vše na jednom místě"],
          features: features.split(/[,;\n]/).map((f) => f.trim()).filter((f) => f.length > 2).slice(0, 8),
          images: ["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1600&q=85"],
          is_featured: false,
          location: `${mappedRegion} kraj`,
        }
        const { error } = await supabaseAdmin.from("venues").insert([newRecord])
        if (!error) inserted++
        else { console.error(`Insert error ${title}:`, error.message); skipped++ }
      }
    }

    // Nový formát (s ID)
    for (let i = 1; i < splitIdx; i++) {
      const r = rows[i]
      if (!r[0] || !/^\d+$/.test(r[0].trim())) continue
      await processRow(
        r[1] ?? "", r[4] ?? "", r[7] ?? "", r[8] ?? "", r[9] ?? "",
        r[12] ?? "", r[13] ?? "", r[14] ?? "", r[15] ?? "",
        r[16] ?? "", r[2] ?? "", r[3] ?? "", r[17] ?? "",
      )
    }

    // Starý formát (bez ID)
    for (let i = splitIdx + 1; i < rows.length; i++) {
      const r = rows[i]
      const t = (r[0] ?? "").trim()
      if (!t || t === "Jméno místa" || t.startsWith("✔") || t.includes("http")) continue
      const emailWeb = r[1] ?? ""
      const email = (emailWeb.match(/[\w.+-]+@[\w.-]+\.\w+/) ?? [""])[0]
      const web = (emailWeb.match(/https?:\/\/[^\s,]+/) ?? [""])[0]
      await processRow(
        t, r[2] ?? "", r[4] ?? "", r[5] ?? "", r[6] ?? "",
        r[8] ?? "", r[8] ?? "", r[9] ?? "", r[9] ?? "",
        r[10] ?? "", email, web, r[11] ?? "",
      )
    }

    // 5. Revalidace stránek
    revalidatePath("/")
    revalidatePath("/venues")
    revalidatePath("/chci-svatbu")

    const duration = Date.now() - startTime
    const summary = {
      ok: true,
      duration_ms: duration,
      updated,
      inserted,
      skipped,
      skipped_vip: skippedVip,
    }
    console.log("[sync-sheet] Hotovo:", summary)
    return NextResponse.json(summary)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[sync-sheet] FAIL:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
