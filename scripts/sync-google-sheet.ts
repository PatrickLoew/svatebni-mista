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
  "Středočeský": "Středočeský", "Středočeský kraj": "Středočeský", "Stredocesky": "Středočeský",
  "Jihočeský": "Jihočeský", "Jihocesky": "Jihočeský", "Jihočeský kraj": "Jihočeský",
  "Plzeňský": "Plzeňský", "Plzensky": "Plzeňský",
  "Karlovarský": "Karlovarský", "Karlovarsky": "Karlovarský",
  "Ústecký": "Ústecký", "Ústecký kraj": "Ústecký", "Ustecky": "Ústecký",
  "Liberecký": "Liberecký", "Liberecký Kraj": "Liberecký", "Liberecky": "Liberecký",
  "Královohradecký": "Královéhradecký", "Královéhradecký": "Královéhradecký",
  "Hradecký kraj": "Královéhradecký", "Kralovehradecky": "Královéhradecký",
  "Pardubický": "Pardubický", "Pardubicky": "Pardubický",
  "Vysočina": "Vysočina", "Vysocina": "Vysočina", "Kraj Vysočina": "Vysočina",
  "Jihomoravský": "Jihomoravský", "Jihomoravsky": "Jihomoravský",
  "Olomoucký": "Olomoucký", "Olomoucky": "Olomoucký",
  "Zlínský": "Zlínský", "Zlinsky": "Zlínský",
  "Moravskoslezský": "Moravskoslezský", "Moravsko-slezský": "Moravskoslezský",
  "Moravskoslezsky": "Moravskoslezský", "MSK": "Moravskoslezský",
  "Beskydy": "Moravskoslezský",
  "Praha": "Praha",
  "Slovensko": "Slovensko",
}

/**
 * Inteligentní detekce kraje z více zdrojů.
 * Pokud regionStr ze sheetu nesedí ze známých formátů, použij další signály:
 *  - Název obce (Štáblovice → Moravskoslezský)
 *  - Volný text v nearCity
 *  - Až jako poslední Středočeský (fallback)
 *
 * Tím zachytíme případy, kdy Monča napsala v regionu "MSK", "Moravsko-slezský",
 * nebo nechala prázdné.
 */

// Mapa obcí/měst → kraj (pro známé VIP lokality)
const CITY_TO_REGION: Record<string, string> = {
  // Moravskoslezský
  "štáblovice": "Moravskoslezský", "stablovice": "Moravskoslezský",
  "opava": "Moravskoslezský", "ostrava": "Moravskoslezský",
  "frýdek": "Moravskoslezský", "frydek": "Moravskoslezský",
  "karviná": "Moravskoslezský", "karvina": "Moravskoslezský",
  "havířov": "Moravskoslezský", "havirov": "Moravskoslezský",
  "nový jičín": "Moravskoslezský", "novy jicin": "Moravskoslezský",
  "krnov": "Moravskoslezský", "bruntál": "Moravskoslezský", "bruntal": "Moravskoslezský",
  "třinec": "Moravskoslezský", "trinec": "Moravskoslezský",
  "ostravice": "Moravskoslezský", "beskydy": "Moravskoslezský",

  // Olomoucký
  "olomouc": "Olomoucký", "přerov": "Olomoucký", "prerov": "Olomoucký",
  "prostějov": "Olomoucký", "prostejov": "Olomoucký",
  "jeseník": "Olomoucký", "jesenik": "Olomoucký",
  "šumperk": "Olomoucký", "sumperk": "Olomoucký",
  "hranice": "Olomoucký",

  // Zlínský
  "zlín": "Zlínský", "zlin": "Zlínský", "kroměříž": "Zlínský", "kromeriz": "Zlínský",
  "uherské hradiště": "Zlínský", "uherske hradiste": "Zlínský",
  "vsetín": "Zlínský", "vsetin": "Zlínský", "valašské": "Zlínský", "valasske": "Zlínský",

  // Jihomoravský
  "brno": "Jihomoravský", "břeclav": "Jihomoravský", "breclav": "Jihomoravský",
  "znojmo": "Jihomoravský", "hodonín": "Jihomoravský", "hodonin": "Jihomoravský",
  "vyškov": "Jihomoravský", "vyskov": "Jihomoravský", "blansko": "Jihomoravský",
  "mikulov": "Jihomoravský", "tišnov": "Jihomoravský", "tisnov": "Jihomoravský",

  // Vysočina
  "jihlava": "Vysočina", "třebíč": "Vysočina", "trebic": "Vysočina",
  "havlíčkův brod": "Vysočina", "havlickuv brod": "Vysočina",
  "žďár": "Vysočina", "zdar": "Vysočina", "pelhřimov": "Vysočina", "pelhrimov": "Vysočina",

  // Pardubický
  "pardubice": "Pardubický", "chrudim": "Pardubický",
  "ústí nad orlicí": "Pardubický", "usti nad orlici": "Pardubický",
  "svitavy": "Pardubický",

  // Královéhradecký
  "hradec králové": "Královéhradecký", "hradec kralove": "Královéhradecký",
  "jičín": "Královéhradecký", "jicin": "Královéhradecký",
  "trutnov": "Královéhradecký", "náchod": "Královéhradecký", "nachod": "Královéhradecký",
  "rychnov": "Královéhradecký",

  // Liberecký
  "liberec": "Liberecký", "jablonec": "Liberecký",
  "česká lípa": "Liberecký", "ceska lipa": "Liberecký",
  "semily": "Liberecký",

  // Ústecký
  "ústí nad labem": "Ústecký", "usti nad labem": "Ústecký",
  "děčín": "Ústecký", "decin": "Ústecký",
  "teplice": "Ústecký", "most": "Ústecký", "louny": "Ústecký",
  "litoměřice": "Ústecký", "litomerice": "Ústecký",
  "chomutov": "Ústecký", "milešovkou": "Ústecký", "milesovkou": "Ústecký",
  "varvažov": "Ústecký", "varvazov": "Ústecký",

  // Karlovarský
  "karlovy vary": "Karlovarský", "cheb": "Karlovarský", "sokolov": "Karlovarský",

  // Plzeňský
  "plzeň": "Plzeňský", "plzen": "Plzeňský", "klatovy": "Plzeňský",
  "tachov": "Plzeňský", "domažlice": "Plzeňský", "domazlice": "Plzeňský",
  "rokycany": "Plzeňský",

  // Jihočeský
  "české budějovice": "Jihočeský", "ceske budejovice": "Jihočeský",
  "český krumlov": "Jihočeský", "cesky krumlov": "Jihočeský",
  "tábor": "Jihočeský", "tabor": "Jihočeský", "písek": "Jihočeský", "pisek": "Jihočeský",
  "strakonice": "Jihočeský", "jindřichův hradec": "Jihočeský", "jindrichuv hradec": "Jihočeský",
  "prachatice": "Jihočeský",

  // Středočeský
  "kladno": "Středočeský", "kolín": "Středočeský", "kolin": "Středočeský",
  "mladá boleslav": "Středočeský", "mlada boleslav": "Středočeský",
  "mělník": "Středočeský", "melnik": "Středočeský",
  "benešov": "Středočeský", "benesov": "Středočeský",
  "kutná hora": "Středočeský", "kutna hora": "Středočeský",
  "příbram": "Středočeský", "pribram": "Středočeský",
  "nymburk": "Středočeský", "rakovník": "Středočeský", "rakovnik": "Středočeský",

  // Praha
  "praha": "Praha", "prague": "Praha",
}

function detectRegion(regionStr: string, title: string, nearCity: string, features: string): string | null {
  // 1) Z sloupce kraje
  const direct = REGION_MAP[regionStr.trim()]
  if (direct) return direct

  // 2) Z názvu místa, nearCity a features — hledej známou obec
  const haystack = `${title} ${nearCity} ${features}`.toLowerCase()
  for (const [city, region] of Object.entries(CITY_TO_REGION)) {
    if (haystack.includes(city)) return region
  }

  // 3) Neznámé — vrátíme null, fallback řeší volající
  return null
}

/**
 * Vícezdrojová detekce typu: bere v potaz archType (sloupec) + název místa + popis (features).
 * Důvod: někdy je v archType "Hotelový styl", ale název je "zámek Wichterle" → správně Zámek.
 */
function normalizeType(archType: string, title = "", features = ""): string {
  // Kombinujeme všechny zdroje pro lepší detekci
  const s = `${archType} ${title} ${features}`.toLowerCase()

  // Zámek / hrad — priorita podle názvu
  if (s.includes("zámek") || s.includes("zámeč") || s.includes("zameck") || s.includes("hrad") || s.includes("château") || s.includes("chateau")) {
    return "Zámek"
  }
  // Vinný sklep
  if (s.includes("víno") || s.includes("vinař") || s.includes("vinné sklep") || s.includes("sklep") || s.includes("sklíp")) {
    return "Vinný sklep"
  }
  // Hotel — pouze pokud není zámek
  if (s.includes("hotel") || s.includes("resort") || s.includes("penzion")) {
    return "Hotel"
  }
  // Statek / mlýn / stodola
  if (s.includes("mlýn") || s.includes("mlejn") || s.includes("stodola") || s.includes("statek") || s.includes("dvůr") || s.includes("ranč") || s.includes("ranch") || s.includes("farma")) {
    return "Venkovský statek"
  }
  // Industriál / loft
  if (s.includes("industriál") || s.includes("industrial") || s.includes("loft") || s.includes("hala") || s.includes("továrn")) {
    return "Moderní prostor"
  }
  // Příroda
  if (s.includes("příroda") || s.includes("priroda") || s.includes("louka") || s.includes("les") || s.includes("u vody") || s.includes("samot") || s.includes("pláž") || s.includes("plaz") || s.includes("rybník")) {
    return "Pláž / Příroda"
  }
  // Historická budova
  if (s.includes("klášter") || s.includes("klaster") || s.includes("fara") || s.includes("histor") || s.includes("tvrz") || s.includes("vila") || s.includes("villa")) {
    return "Historická budova"
  }
  return "Historická budova"
}

function mapCatering(s: string): string {
  if (!s) return "negotiable"
  const t = s.toLowerCase().trim()

  // 1) Přímé kódy z normalizovaného sloupce
  if (t === "own_free" || t.includes("own_free")) return "own_free"
  if (t === "own_drinks_free" || t.includes("own_drinks")) return "own_drinks_free"
  if (t === "only_venue" || t.includes("only_venue")) return "only_venue"
  if (t === "negotiable") return "negotiable"

  // 2) Přesné formulace z Mončina sheetu (sloupec N — normalizace)
  if (t.includes("vlastní jídlo/pití") || t.includes("vlastni jidlo/piti")) return "own_free"
  if (t.includes("povinný interní catering") || t.includes("povinny interni catering")) return "only_venue"
  if (t === "dle domluvy") return "negotiable"

  // 3) Přesné formulace ze sloupce M (volný text klientovi)
  if (
    t.includes("musí mít catering") ||
    t.includes("musi mit catering") ||
    t.includes("catering a pití od nás") ||
    t.includes("catering od nás") ||
    t.includes("catering od nas")
  ) return "only_venue"

  if (
    t.includes("možnost vlastního pití a jídla") ||
    t.includes("moznost vlastniho piti a jidla") ||
    t.includes("vlastního pití a jídla bez poplatků") ||
    t.includes("vlastniho piti a jidla bez poplatku")
  ) return "own_free"

  // 4) Pouze vlastní pití (jídlo z místa)
  if (
    t.includes("možnost vlastního pití") && !t.includes("jídla") ||
    t.includes("pouze vlastní pití") ||
    t.includes("jen vlastní pití") ||
    t.includes("vlastní alkohol") ||
    t.includes("vlastni alkohol")
  ) return "own_drinks_free"

  // 5) Obecné fráze — vlastní jídlo I pití (kompletní)
  if (
    (t.includes("vlastní") && t.includes("jídlo") && t.includes("pití")) ||
    (t.includes("vlastni") && t.includes("jidlo") && t.includes("piti")) ||
    t.includes("vlastní jídlo i pití") ||
    t.includes("vlastní jídlo a pití") ||
    t.includes("vše vlastní") ||
    (t.includes("vlastní") && t.includes("bez poplatk")) ||
    (t.includes("vlastní") && t.includes("zdarma"))
  ) return "own_free"

  // 6) Obecné fráze pro vlastní pití
  if (
    t.includes("vlastní pití") ||
    t.includes("vlastni piti") ||
    (t.includes("pití") && t.includes("bez poplatk"))
  ) return "own_drinks_free"

  // 7) Obecné fráze pro zákaz vlastního cateringu
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
  if (s.includes("praha") || s.includes("prague")) return "Praha"
  if (s.includes("brno")) return "Brno"
  if (s.includes("budějovic") || s.includes("budejovic")) return "České Budějovice"
  if (s.includes("plzn") || s.includes("plzeň")) return "Plzeň"
  if (s.includes("hradec")) return "Hradec Králové"
  if (s.includes("ostrav")) return "Ostrava"
  if (s.includes("olomouc")) return "Olomouc"
  if (s.includes("liberec")) return "Liberec"
  return null
}

/**
 * Pokud `nearest_city` chybí, odvoď nejbližší velké město z kraje.
 * To je důležité pro vyhodnocení "do 90 min od X" — bez tohoto AI neví,
 * jak je místo daleko od Ostravy/Brna/Prahy.
 */
function inferNearestCity(region: string, explicitCity: string | null): string | null {
  if (explicitCity) return explicitCity
  const regionToCity: Record<string, string> = {
    "Praha": "Praha",
    "Středočeský": "Praha",
    "Ústecký": "Praha",          // jih kraje blíž Praze, sever Liberec
    "Liberecký": "Liberec",
    "Královéhradecký": "Hradec Králové",
    "Pardubický": "Hradec Králové",
    "Plzeňský": "Plzeň",
    "Karlovarský": "Plzeň",
    "Jihočeský": "České Budějovice",
    "Vysočina": "Brno",
    "Jihomoravský": "Brno",
    "Zlínský": "Ostrava",         // ale je tu i Brno blízko
    "Olomoucký": "Olomouc",
    "Moravskoslezský": "Ostrava",
  }
  return regionToCity[region] ?? null
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

    const detectedRegion = detectRegion(v.region, v.title, v.nearCity, v.features)
    if (!detectedRegion) {
      console.warn(`⚠️ Neznámý kraj pro "${v.title}" (region="${v.region}", nearCity="${v.nearCity}") — fallback Středočeský`)
    }
    const region = detectedRegion ?? "Středočeský"
    const type = normalizeType(v.archType, v.title, v.features)
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
      nearest_city: inferNearestCity(region, mapNearestCity(v.nearCity)),
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
