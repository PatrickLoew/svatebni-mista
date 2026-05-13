/**
 * Diagnostika: zobrazí unikátní hodnoty v sloupcích catering a party
 * v hlavním Google Sheetu. Pomůže nám zjistit, jaké formulace tam Monča
 * používá a jestli naše mapping je pokrývá.
 */
import fs from "fs"
import path from "path"

const envPath = path.join(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf-8").split("\n").forEach((line) => {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m) process.env[m[1]] = m[2].trim()
  })
}

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

async function main() {
  console.log("📥 Stahuji sheet pro diagnostiku...\n")
  const resp = await fetch(SHEET_URL)
  const text = await resp.text()
  const rows = parseCSV(text)

  // Najít split
  let splitIdx = rows.length
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0]?.trim() === "Jméno místa") { splitIdx = i; break }
  }

  const newFormat = rows.slice(1, splitIdx)
  const oldFormat = rows.slice(splitIdx + 1)

  console.log("=".repeat(70))
  console.log("HLAVIČKA (sloupce):")
  console.log("=".repeat(70))
  for (let i = 0; i < rows[0].length; i++) {
    console.log(`  [${i}] = "${rows[0][i].substring(0, 60)}"`)
  }

  console.log("\n" + "=".repeat(70))
  console.log("NOVÝ FORMÁT — UNIKÁTNÍ CATERING M (index 12):")
  console.log("=".repeat(70))
  const cateringM = new Set<string>()
  for (const r of newFormat) {
    if (r[0] && /^\d+$/.test(r[0].trim()) && r[12]) cateringM.add(r[12].trim())
  }
  for (const v of cateringM) console.log(`  "${v}"`)

  console.log("\n" + "=".repeat(70))
  console.log("NOVÝ FORMÁT — UNIKÁTNÍ CATERING N (index 13):")
  console.log("=".repeat(70))
  const cateringN = new Set<string>()
  for (const r of newFormat) {
    if (r[0] && /^\d+$/.test(r[0].trim()) && r[13]) cateringN.add(r[13].trim())
  }
  for (const v of cateringN) console.log(`  "${v}"`)

  console.log("\n" + "=".repeat(70))
  console.log("NOVÝ FORMÁT — UNIKÁTNÍ PARTY O (index 14):")
  console.log("=".repeat(70))
  const partyO = new Set<string>()
  for (const r of newFormat) {
    if (r[0] && /^\d+$/.test(r[0].trim()) && r[14]) partyO.add(r[14].trim())
  }
  for (const v of partyO) console.log(`  "${v}"`)

  console.log("\n" + "=".repeat(70))
  console.log("NOVÝ FORMÁT — UNIKÁTNÍ PARTY P (index 15):")
  console.log("=".repeat(70))
  const partyP = new Set<string>()
  for (const r of newFormat) {
    if (r[0] && /^\d+$/.test(r[0].trim()) && r[15]) partyP.add(r[15].trim())
  }
  for (const v of partyP) console.log(`  "${v}"`)

  console.log("\n" + "=".repeat(70))
  console.log("STARÝ FORMÁT — HLAVIČKA:")
  console.log("=".repeat(70))
  if (rows[splitIdx]) {
    for (let i = 0; i < rows[splitIdx].length; i++) {
      console.log(`  [${i}] = "${rows[splitIdx][i].substring(0, 60)}"`)
    }
  }

  console.log("\n" + "=".repeat(70))
  console.log("STARÝ FORMÁT — UNIKÁTNÍ CATERING (index 8):")
  console.log("=".repeat(70))
  const cateringOld = new Set<string>()
  for (const r of oldFormat) {
    if (r[0]?.trim() && !r[0].includes("http") && !r[0].includes("@") && r[8]) cateringOld.add(r[8].trim())
  }
  for (const v of cateringOld) console.log(`  "${v}"`)

  console.log("\n" + "=".repeat(70))
  console.log("STARÝ FORMÁT — UNIKÁTNÍ PARTY (index 9):")
  console.log("=".repeat(70))
  const partyOld = new Set<string>()
  for (const r of oldFormat) {
    if (r[0]?.trim() && !r[0].includes("http") && !r[0].includes("@") && r[9]) partyOld.add(r[9].trim())
  }
  for (const v of partyOld) console.log(`  "${v}"`)

  console.log("\n" + "=".repeat(70))
  console.log("STARÝ FORMÁT — UNIKÁTNÍ UBYTOVÁNÍ (index 6):")
  console.log("=".repeat(70))
  const accomOld = new Set<string>()
  for (const r of oldFormat) {
    if (r[0]?.trim() && !r[0].includes("http") && !r[0].includes("@") && r[6]) accomOld.add(r[6].trim())
  }
  for (const v of accomOld) console.log(`  "${v}"`)
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1) })
