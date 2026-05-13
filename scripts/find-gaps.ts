/**
 * Diagnostika: Najde KONKRÉTNÍ místa, která mají díry,
 * a porovnává to s tím, co je ve sheetu (jestli tam je info).
 *
 * Cíl: zjistit jestli problém je
 *   A) data v sheetu chybí
 *   B) mapping je špatný
 *   C) místo v sheetu vůbec není (sync ho nepřenesl)
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

const normStr = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim()

interface SheetData {
  title: string
  catering: string      // sloupec M
  cateringNorm: string  // sloupec N
  party: string         // sloupec O
  partyNorm: string     // sloupec P
  accommodation: string // sloupec J + K
  format: "new" | "old"
}

async function main() {
  console.log("🔍 Diagnostika děr v datech...\n")

  // 1) Stáhnout sheet
  const resp = await fetch(SHEET_URL)
  const text = await resp.text()
  const rows = parseCSV(text)

  let splitIdx = rows.length
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0]?.trim() === "Jméno místa") { splitIdx = i; break }
  }

  // 2) Indexovat sheet podle názvu
  const sheetByTitle = new Map<string, SheetData>()
  for (let i = 1; i < splitIdx; i++) {
    const r = rows[i]
    if (!r[0] || !/^\d+$/.test(r[0].trim())) continue
    const title = (r[1] ?? "").trim()
    if (!title) continue
    sheetByTitle.set(normStr(title), {
      title,
      catering: r[12] ?? "",
      cateringNorm: r[13] ?? "",
      party: r[14] ?? "",
      partyNorm: r[15] ?? "",
      accommodation: `${r[10] ?? ""} | ${r[9] ?? ""}`,
      format: "new",
    })
  }
  for (let i = splitIdx + 1; i < rows.length; i++) {
    const r = rows[i]
    const title = (r[0] ?? "").trim()
    if (!title || title === "Jméno místa" || title.includes("http") || title.includes("@")) continue
    sheetByTitle.set(normStr(title), {
      title,
      catering: r[8] ?? "",
      cateringNorm: r[8] ?? "",
      party: r[9] ?? "",
      partyNorm: r[9] ?? "",
      accommodation: r[6] ?? "",
      format: "old",
    })
  }

  // 3) Načíst DB
  const { data: venues } = await supabase
    .from("venues")
    .select("id, title, is_featured, catering_policy, night_party_policy, accommodation_capacity")

  if (!venues) return

  // 4) Analyzovat každý typ chyby
  const gapsCatering: { title: string; vip: boolean; sheet: SheetData | null }[] = []
  const gapsParty: typeof gapsCatering = []
  const gapsAccom: typeof gapsCatering = []

  for (const v of venues) {
    const sheet = sheetByTitle.get(normStr(v.title)) ?? null

    if (!v.catering_policy || v.catering_policy === "negotiable") {
      gapsCatering.push({ title: v.title, vip: v.is_featured, sheet })
    }
    if (!v.night_party_policy || v.night_party_policy === "negotiable") {
      gapsParty.push({ title: v.title, vip: v.is_featured, sheet })
    }
    if (!v.accommodation_capacity || v.accommodation_capacity === 0) {
      gapsAccom.push({ title: v.title, vip: v.is_featured, sheet })
    }
  }

  console.log("=".repeat(70))
  console.log(`📋 CATERING: ${gapsCatering.length} míst má negotiable/null\n`)
  for (const g of gapsCatering.slice(0, 30)) {
    const vip = g.vip ? "⭐" : "  "
    if (!g.sheet) {
      console.log(`${vip} ${g.title.padEnd(40)} ❌ NENALEZENO ve sheetu`)
    } else {
      const empty = !g.sheet.catering && !g.sheet.cateringNorm
      console.log(`${vip} ${g.title.padEnd(40)} ${empty ? "🔴 prázdné v sheetu" : "⚠️ má text:"}`)
      if (!empty) {
        console.log(`     M="${g.sheet.catering.substring(0, 60)}"`)
        console.log(`     N="${g.sheet.cateringNorm.substring(0, 60)}"`)
      }
    }
  }
  if (gapsCatering.length > 30) console.log(`   ... +${gapsCatering.length - 30} dalších`)

  console.log("\n" + "=".repeat(70))
  console.log(`🎉 PARTY: ${gapsParty.length} míst má negotiable/null\n`)
  for (const g of gapsParty.slice(0, 30)) {
    const vip = g.vip ? "⭐" : "  "
    if (!g.sheet) {
      console.log(`${vip} ${g.title.padEnd(40)} ❌ NENALEZENO ve sheetu`)
    } else {
      const empty = !g.sheet.party && !g.sheet.partyNorm
      console.log(`${vip} ${g.title.padEnd(40)} ${empty ? "🔴 prázdné v sheetu" : "⚠️ má text:"}`)
      if (!empty) {
        console.log(`     O="${g.sheet.party.substring(0, 60)}"`)
        console.log(`     P="${g.sheet.partyNorm.substring(0, 60)}"`)
      }
    }
  }
  if (gapsParty.length > 30) console.log(`   ... +${gapsParty.length - 30} dalších`)

  console.log("\n" + "=".repeat(70))
  console.log(`🛏️ UBYTOVÁNÍ = 0: ${gapsAccom.length} míst\n`)
  for (const g of gapsAccom.slice(0, 30)) {
    const vip = g.vip ? "⭐" : "  "
    if (!g.sheet) {
      console.log(`${vip} ${g.title.padEnd(40)} ❌ NENALEZENO ve sheetu`)
    } else {
      const empty = !g.sheet.accommodation
      console.log(`${vip} ${g.title.padEnd(40)} ${empty ? "🔴 prázdné v sheetu" : "⚠️ text:"}`)
      if (!empty) {
        console.log(`     "${g.sheet.accommodation.substring(0, 80)}"`)
      }
    }
  }
  if (gapsAccom.length > 30) console.log(`   ... +${gapsAccom.length - 30} dalších`)
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1) })
