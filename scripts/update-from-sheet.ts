/**
 * Aktualizace catering_policy + night_party_policy + accommodation_capacity
 * + features pro non-VIP místa z hlavního Google Sheetu.
 *
 * NEMAŽE — jen UPDATE existujících záznamů.
 * VIP místa (is_featured = true) přeskakuje (mají data z vip-master.csv).
 *
 * Použití: npm run update-from-sheet
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

const normStr = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim()

/* ─────────── Mapování (vylepšené) ─────────── */

/**
 * Mapování cateringu — pokrývá VŠECHNY formulace v Mončině sheetu (sloupec M a N).
 *
 * Priorita:
 * 1) Normalizační sloupec N obsahuje 4 přesné hodnoty:
 *    "povinný interní catering/pití" / "vlastní jídlo/pití bez poplatků"
 *    / "dle domluvy" / "ověřit detail"
 * 2) Pokud N je "ověřit detail" nebo prázdný, fallback na M (volný text)
 * 3) M má desítky variant — hledáme klíčová slova
 */
/**
 * Pokročilé mapování cateringu.
 * Volá se s kombinací: pokud N je "ověřit detail", použij text z M.
 */
function mapCateringSmart(rawM: string, rawN: string): string {
  const norm = rawN.toLowerCase().trim()
  // Pokud N je jasný, použij N
  if (norm === "povinný interní catering/pití") return "only_venue"
  if (norm === "vlastní jídlo/pití bez poplatků") return "own_free"
  if (norm === "dle domluvy") return "negotiable"
  // Pokud N je "ověřit detail" → použij M (volný text)
  return mapCatering(rawM || rawN)
}

function mapCatering(s: string): string {
  if (!s) return "negotiable"
  const t = s.toLowerCase().trim()

  // ========== PŘÍMÉ KÓDY (pokud někdo zapsal kód) ==========
  if (t === "own_free") return "own_free"
  if (t === "own_drinks_free") return "own_drinks_free"
  if (t === "only_venue") return "only_venue"
  if (t === "negotiable") return "negotiable"

  // ========== SLOUPEC N — PŘESNÉ HODNOTY ==========
  if (t === "povinný interní catering/pití") return "only_venue"
  if (t === "vlastní jídlo/pití bez poplatků") return "own_free"
  if (t === "dle domluvy") return "negotiable"
  if (t === "ověřit detail") return "negotiable"

  // ========== MONČA SLOUPEC M (volný text) — známé formulace ==========

  // "Snoubenci mají možnost vlastního pití a jídla bez poplatků" → own_free
  // "Jídlo a pití vlastní bez poplatků" → own_free
  // "vlastní jídlo a pití snoubenců bez poplatků, nebo zajistíme catering" → own_free
  if (
    (t.includes("vlastní") && (t.includes("jídlo") || t.includes("jidlo")) && (t.includes("pití") || t.includes("piti")) && t.includes("bez poplatk")) ||
    (t.includes("vlastního pití a jídla") && t.includes("bez poplatk")) ||
    (t.includes("jídlo a pití") && t.includes("vlastní") && t.includes("bez poplatk"))
  ) return "own_free"

  // "Vše od nás" / "Snoubenci musí mít catering a pití od nás"
  // "Snoubenci musí mít catering a pití od nás, mohou mít však vlastní svatební dort"
  // "Catering od nás, nápoje mohou kombinovat..." (catering povinný)
  if (
    t === "vše od nás" || t === "vse od nas" ||
    t.includes("musí mít catering") || t.includes("musi mit catering") ||
    t.includes("catering a pití od nás") ||
    t.includes("podmínkou pronájmu je náš catering") ||
    t.includes("catering je nutný od nás") ||
    t.includes("catering nutný od nás") ||
    t.includes("jídlo od nás nebo odstupné")
  ) return "only_venue"

  // "Snoubenci můžou mít vlastní pití" / "Vlastní pití snoubenců bez poplatků"
  // "snoubenci mohou mít vlastní pití bez příplatku"
  // "Pití je volne" / "Pití od nás, catering mohou mít vlastní"
  // "Catering a nápoje od nás, tvrdý alkohol může být vlastní bez korkovného"
  // "Jídlo a nealko od nás, alkohol vlastní" → catering povinný, ale alkohol vlastní → own_drinks_free
  // "snoubenci mohou mít vlastní dort a vlastní alkohol, za kolkovné" → negotiable (s poplatkem)
  if (
    (t.includes("můžou mít vlastní pití") || t.includes("muzou mit vlastni piti")) ||
    (t.includes("mohou mít vlastní pití") || t.includes("mohou mit vlastni piti")) ||
    (t.includes("vlastní pití") && t.includes("bez poplatk")) ||
    t.includes("pití je volne") || t.includes("piti je volne") ||
    (t.includes("alkohol") && t.includes("vlastní") && t.includes("bez korkovn")) ||
    (t.includes("alkohol vlastní") && (t.includes("od nás") || t.includes("od nas"))) ||
    (t.includes("vlastní pití") && !t.includes("jídlo") && !t.includes("korkovn") && !t.includes("poplatek"))
  ) return "own_drinks_free"

  // Komplexnější fráze — částečné povolení vlastního ale s poplatkem/korkovným
  // → negotiable (není to ani zákaz ani volné bez poplatků)
  if (
    t.includes("korkovné") || t.includes("korkovne") ||
    t.includes("za poplatek") ||
    t.includes("za příplatek") || t.includes("za priplatek") ||
    t.includes("dle domluvy") ||
    t.includes("nebo dle domluvy") ||
    t.includes("po domluvě") || t.includes("po domluve") ||
    t.includes("doporučujeme jeden catering") ||
    t.includes("většinou dodáváme") ||
    t.includes("ale snoubenci mohou")
  ) return "negotiable"

  // Fallback — pokusíme se ještě podle obecných klíčů
  if (
    t.includes("vlastní") && (t.includes("bez poplatk") || t.includes("zdarma"))
  ) return "own_free"
  if (
    t.includes("od nás") || t.includes("od nas") ||
    t.includes("interní") || t.includes("interni") ||
    t.includes("povinný") || t.includes("povinny")
  ) return "only_venue"

  return "negotiable"
}

/**
 * Smart wrapper: pokud P je "ověřit detail" / "nevyplněno", použij text z O.
 */
function mapPartySmart(rawO: string, rawP: string): string {
  const norm = rawP.toLowerCase().trim()
  if (norm === "po 22:00 s přesunem dovnitř") return "indoor_after_22"
  if (norm === "bez nočního limitu / neruší okolí") return "no_curfew"
  if (norm === "možné po 22:00 dle podmínek") return "indoor_after_22"
  // "ověřit detail", "nevyplněno", nebo cokoliv jiného → použij O text
  return mapParty(rawO || rawP)
}

/**
 * Mapování party — pokrývá VŠECHNY formulace v Mončině sheetu.
 */
function mapParty(s: string): string {
  if (!s) return "negotiable"
  const t = s.toLowerCase().trim()

  // ========== PŘÍMÉ KÓDY ==========
  if (t === "no_curfew") return "no_curfew"
  if (t === "indoor_after_22") return "indoor_after_22"
  if (t === "quiet_hours") return "quiet_hours"
  if (t === "negotiable") return "negotiable"

  // ========== SLOUPEC P — PŘESNÉ HODNOTY ==========
  if (t === "po 22:00 s přesunem dovnitř") return "indoor_after_22"
  if (t === "bez nočního limitu / neruší okolí") return "no_curfew"
  if (t === "možné po 22:00 dle podmínek") return "indoor_after_22"
  if (t === "nevyplněno") return "negotiable"
  if (t === "ověřit detail") return "negotiable"

  // ========== MONČA SLOUPEC O (volný text) — známé formulace ==========

  // "Máme místo, kde nerušíme noční klid" / "Nerušíme noční klid" / "Žádný noční klid"
  // "party možná až do rána"
  // "Hudba do 00:00 hodin ale párty muže pokračovat" → no_curfew
  if (
    t.includes("nerušíme noční klid") || t.includes("nerusime nocni klid") ||
    t.includes("nerušíme noc") ||
    t.includes("žádný noční klid") || t.includes("zadny nocni klid") ||
    t.includes("bez nočního klidu") || t.includes("bez nocniho klidu") ||
    t.includes("bez nočního limitu") || t.includes("bez nocniho limitu") ||
    t.includes("do rána") || t.includes("do rana") ||
    t.includes("dostatečné vzdálenosti od ostatních") ||
    t.includes("dále od sousedů")
  ) return "no_curfew"

  // "Party možná i po 22.00, pouze s přesunem do párty místnosti"
  // "po 22.00 party místnost"
  // "Pokud mají rezervovaný dostatek pokojů v hotelu, může být i po 22 hodině"
  // "po 22.h je hudba možná jen ve stodole"
  // "Přesun ve 21 hod. do jiné místnosti"
  // "Party možná i po 22.00, pouze potřeba nastavit hudbu"
  // "Hudba venku do 22:00 potom ve vnitřních prostorách"
  // "party možná i po 22 hod při zachování regulace"
  // "party možná do 02:00"
  // "do půlnoci"
  // "max do 22.hod pokud nebydlí, pokud se zarezervuje celý hotel"
  // "Dle počtu hostů, je možná party ve stávajícím místě nebo s přesunem"
  if (
    (t.includes("po 22") && (t.includes("party") || t.includes("párty") || t.includes("přesun") || t.includes("presun") || t.includes("místn") || t.includes("mistn") || t.includes("hotelu") || t.includes("stodole") || t.includes("regulac") || t.includes("podmín"))) ||
    t.includes("po 22.00 party místnost") ||
    t.includes("přesun ve") || t.includes("presun ve") ||
    t.includes("přesun do") || t.includes("presun do") ||
    t.includes("hudba venku do 22") ||
    t.includes("party možná do 02") ||
    t.includes("do půlnoci") || t.includes("do pulnoci") ||
    t.includes("do 02:00") ||
    t.includes("zarezervuje celý hotel") ||
    t.includes("v rozumné míře")
  ) return "indoor_after_22"

  // "Do půlnoci" / "do 00:00" / "Hudba do 00:00" → indoor_after_22 (de facto)
  if (
    t === "do půlnoci" || t === "do pulnoci" ||
    t.includes("hudba do 00") ||
    t.includes("hudba do 24") ||
    t.includes("do 00:00") ||
    (t.includes("párty") && t.includes("pokračovat"))
  ) return "indoor_after_22"

  // "party možná do 02:00" / "do 2:00" / "do rána / až do rána" → no_curfew
  if (
    t.includes("možná do 02") ||
    t.includes("mozna do 02") ||
    t.includes("do 2:00") ||
    t.includes("do 02:00") ||
    t.includes("možná až do rána") ||
    t.includes("dle domluvy") && t.includes("rána") ||
    t.includes("hudba se může pouštět do 2") ||
    (t.includes("víkendu") && t.includes("do 2:00"))
  ) return "no_curfew"

  // "Většinou do 22:00, pak třeba stlumit prostředí" → indoor_after_22
  // (klient může pokračovat, ale ztlumeně)
  if (
    t.includes("většinou do 22") && (t.includes("stlumit") || t.includes("ztlumit") || t.includes("pak")) ||
    t.includes("oficiálně zavíráme") && t.includes("většinou") ||
    t.includes("party max do 23")
  ) return "indoor_after_22"

  // Noční klid platí — party končí v 22:00, žádné výjimky
  // "Party max do 22.00" / "Bohužel není možné na zámku Jemniště pořádat večerní party"
  if (
    t.includes("max do 22") ||
    t.includes("party max do 22") ||
    t.includes("party do 22") && !t.includes("po 22") ||
    t === "do 22" ||
    t.includes("není možné") ||
    t.includes("neni mozne")
  ) return "quiet_hours"

  // Dle domluvy → negotiable
  if (
    t === "dle domluvy" ||
    t.includes("dle domluvy") ||
    t.includes("po domluvě")
  ) return "negotiable"

  return "negotiable"
}

function parseAccommodation(s: string): number {
  if (!s) return 0
  const t = s.toLowerCase().trim()

  // Pokud explicitně "v okolí" / "nepřímo" → 0
  if (t.includes("okolí") || t.includes("okoli")) return 0
  if (t.includes("ne -") || t === "ne") return 0
  if (t.includes("nepotřebujeme") || t.includes("nemáme")) return 0

  // Najdi všechna čísla a sečti (např. "20+30", "20 + 30", "20 osob hosté a 30 v penzionu")
  const numbers = s.match(/\d+/g)
  if (!numbers) {
    // Pokud je tu "Ano - přímo" bez čísla, dáme default 30 (víme, že jde)
    if (t.includes("ano") && (t.includes("přímo") || t.includes("primo"))) return 30
    return 0
  }
  if (numbers.length === 1) return Number(numbers[0])
  return numbers.map(Number).reduce((a, b) => a + b, 0)
}

function parseFeatures(addedValue: string, services: string, archType: string): string[] {
  const all = `${addedValue} ${services} ${archType}`.toLowerCase()
  const out: string[] = []
  if (all.includes("wellness")) out.push("Wellness")
  if (all.includes("bazén") || all.includes("biotop") || all.includes("koupací")) out.push("Bazén / biotop")
  if (all.includes("sauna")) out.push("Sauna")
  if (all.includes("pes") || all.includes("pej") || all.includes("psy") || all.includes("psí") || all.includes("pet friendly") || all.includes("pet-friendly")) out.push("Pejsek vítán")
  if (all.includes("rybníček") || all.includes("rybníky") || all.includes("rybník") || all.includes("jezírk") || all.includes("u vody")) out.push("U vody / rybník")
  if (all.includes("hřiště") || all.includes("dětsk")) out.push("Dětské hřiště")
  if (all.includes("luxusní ubytování")) out.push("Luxusní ubytování")
  if (all.includes("samot")) out.push("Soukromý areál / samota")
  if (all.includes("zahrada")) out.push("Zahrada")
  if (all.includes("stodola")) out.push("Stodola")
  if (all.includes("výzdoba")) out.push("Výzdoba v ceně")
  if (all.includes("hory") || all.includes("horský") || all.includes("výhled")) out.push("Horský výhled")
  if (all.includes("vinný sklep") || all.includes("vinař")) out.push("Vinný sklep")
  if (all.includes("bezbariér")) out.push("Bezbariérovost")
  if (all.includes("příroda")) out.push("Příroda kolem")
  if (all.includes("krb")) out.push("Krb")
  return [...new Set(out)].slice(0, 8)
}

/* ─────────── HLAVNÍ ─────────── */

interface SheetRow {
  title: string
  capacity: number
  archType: string
  accommodation: string
  catering: string
  cateringNorm: string
  party: string
  partyNorm: string
  features: string
}

function parseNewFormatRow(r: string[]): SheetRow | null {
  if (!r[0] || !/^\d+$/.test(r[0].trim())) return null
  const title = (r[1] ?? "").trim()
  if (!title || title.includes("http") || title.includes("@")) return null

  // accommodationNorm (index 10) má normalizovanou hodnotu — pokud existuje, je to číslo
  // Pokud ne, fallback na free text (index 9)
  const accomCombined = `${r[10] ?? ""} ${r[9] ?? ""}`.trim()

  return {
    title,
    capacity: Number((r[7] ?? "").trim()) || 80,
    archType: r[8] ?? "",
    accommodation: accomCombined,
    catering: r[12] ?? "",
    cateringNorm: r[13] ?? "",
    party: r[14] ?? "",
    partyNorm: r[15] ?? "",
    features: r[16] ?? "",
  }
}

function parseOldFormatRow(r: string[]): SheetRow | null {
  const title = (r[0] ?? "").trim()
  if (!title || title === "Jméno místa") return null
  if (title.includes("http") || title.includes("@") || title.startsWith("✔")) return null

  return {
    title,
    capacity: Number((r[4] ?? "").replace(/\D/g, "")) || 80,
    archType: r[5] ?? "",
    accommodation: r[6] ?? "",
    catering: r[8] ?? "",
    cateringNorm: r[8] ?? "",
    party: r[9] ?? "",
    partyNorm: r[9] ?? "",
    features: r[10] ?? "",
  }
}

async function main() {
  console.log("🔄 Aktualizace non-VIP míst z hlavního sheetu...\n")

  // 1) Stáhnout sheet
  console.log("📥 Stahuji Google Sheet...")
  const resp = await fetch(SHEET_URL)
  if (!resp.ok) {
    console.error(`❌ Status ${resp.status}`)
    process.exit(1)
  }
  const text = await resp.text()
  const rows = parseCSV(text)
  console.log(`✓ ${rows.length} řádků\n`)

  // 2) Najít split mezi novým a starým formátem
  let splitIdx = rows.length
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0]?.trim() === "Jméno místa") { splitIdx = i; break }
  }

  // 3) Parsovat
  const sheetRows: SheetRow[] = []
  for (let i = 1; i < splitIdx; i++) {
    const r = parseNewFormatRow(rows[i])
    if (r) sheetRows.push(r)
  }
  for (let i = splitIdx + 1; i < rows.length; i++) {
    const r = parseOldFormatRow(rows[i])
    if (r) sheetRows.push(r)
  }
  console.log(`📊 ${sheetRows.length} míst v sheetu\n`)

  // 4) Načti DB
  const { data: dbVenues, error } = await supabase
    .from("venues")
    .select("id, title, is_featured, catering_policy, night_party_policy, accommodation_capacity, features")

  if (error) { console.error("❌", error.message); process.exit(1) }

  const dbByTitle = new Map<string, { id: string; isFeatured: boolean }>()
  for (const v of dbVenues ?? []) {
    dbByTitle.set(normStr(v.title), { id: v.id, isFeatured: v.is_featured })
  }

  // 5) Pro každý řádek ze sheetu — najdi v DB, aktualizuj pokud non-VIP
  let updated = 0
  let skippedVip = 0
  let notFound = 0
  let cateringFixed = 0
  let partyFixed = 0
  let lůžkaFixed = 0
  let featuresFixed = 0

  for (const s of sheetRows) {
    const titleN = normStr(s.title)
    const existing = dbByTitle.get(titleN)

    if (!existing) {
      // Zkusit fuzzy match
      let found: { id: string; isFeatured: boolean } | undefined
      for (const [k, val] of dbByTitle.entries()) {
        if (k === titleN) { found = val; break }
        if (k.length > 5 && titleN.length > 5) {
          if (k.includes(titleN.substring(0, 8)) || titleN.includes(k.substring(0, 8))) {
            found = val
            break
          }
        }
      }
      if (!found) {
        notFound++
        continue
      }
      if (found.isFeatured) { skippedVip++; continue }

      const accommodation = parseAccommodation(s.accommodation)
      const catering = mapCatering(s.cateringNorm || s.catering)
      const party = mapParty(s.partyNorm || s.party)
      const features = parseFeatures(s.features, "", s.archType)

      const updates: Record<string, unknown> = {}
      updates.accommodation_capacity = accommodation
      updates.catering_policy = catering
      updates.night_party_policy = party
      if (features.length >= 3) updates.features = features

      const { error: upd } = await supabase.from("venues").update(updates).eq("id", found.id)
      if (!upd) {
        updated++
        if (accommodation > 0) lůžkaFixed++
        if (catering !== "negotiable") cateringFixed++
        if (party !== "negotiable") partyFixed++
        if (features.length >= 3) featuresFixed++
      }
      continue
    }

    if (existing.isFeatured) {
      skippedVip++
      continue
    }

    const accommodation = parseAccommodation(s.accommodation)
    const catering = mapCateringSmart(s.catering, s.cateringNorm)
    const party = mapPartySmart(s.party, s.partyNorm)
    const features = parseFeatures(s.features, "", s.archType)

    const updates: Record<string, unknown> = {}
    updates.accommodation_capacity = accommodation
    updates.catering_policy = catering
    updates.night_party_policy = party
    if (features.length >= 3) updates.features = features

    const { error: upd } = await supabase.from("venues").update(updates).eq("id", existing.id)
    if (!upd) {
      updated++
      if (accommodation > 0) lůžkaFixed++
      if (catering !== "negotiable") cateringFixed++
      if (party !== "negotiable") partyFixed++
      if (features.length >= 3) featuresFixed++
    }
  }

  console.log("═".repeat(70))
  console.log(`✅ Aktualizováno ${updated} non-VIP míst:`)
  console.log(`   ${lůžkaFixed}× má teď accommodation_capacity > 0`)
  console.log(`   ${cateringFixed}× má specifický catering (own_free / only_venue / own_drinks_free)`)
  console.log(`   ${partyFixed}× má specifický party policy`)
  console.log(`   ${featuresFixed}× má features ≥3`)
  console.log(`   🔒 ${skippedVip}× VIP přeskočeno (jsou z vip-master.csv)`)
  console.log(`   ⚠️ ${notFound}× nenalezeno v DB`)
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1) })
