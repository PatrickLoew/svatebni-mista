/**
 * KOMPLETNÍ HEALTH CHECK aplikace.
 *
 * Testuje vše: env vars, DB, settings, venues, inquiries, AI, sync data,
 * mapping, validační logika, geografie, email config.
 *
 * Použití: npm run health-check
 *
 * Vrátí seznam ✓ / ✗ pro každou součást, plus shrnutí.
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

interface CheckResult {
  category: string
  name: string
  status: "ok" | "warn" | "fail"
  detail?: string
}

const results: CheckResult[] = []

function check(category: string, name: string, status: "ok" | "warn" | "fail", detail?: string) {
  results.push({ category, name, status, detail })
}

/* ─────────── 1. ENV VARIABLES ─────────── */

async function checkEnv() {
  console.log("\n🔑 1. ENVIRONMENT VARIABLES\n")

  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "ANTHROPIC_API_KEY",
  ]
  const optional = [
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
    "RESEND_TO_EMAIL",
    "GOOGLE_SHEET_URL",
  ]

  for (const k of required) {
    const v = process.env[k]
    if (v && v.length > 10) {
      check("env", k, "ok", `${v.substring(0, 20)}...`)
      console.log(`   ✓ ${k.padEnd(35)} (${v.length} znaků)`)
    } else {
      check("env", k, "fail", "chybí")
      console.log(`   ✗ ${k.padEnd(35)} CHYBÍ!`)
    }
  }

  for (const k of optional) {
    const v = process.env[k]
    if (v && v.length > 5) {
      check("env", k, "ok", v.substring(0, 30))
      console.log(`   ✓ ${k.padEnd(35)} (${v.substring(0, 30)})`)
    } else {
      check("env", k, "warn", "chybí — volitelné")
      console.log(`   ⚠ ${k.padEnd(35)} CHYBÍ (volitelné)`)
    }
  }
}

/* ─────────── 2. DATABASE CONNECTION ─────────── */

async function checkDatabase() {
  console.log("\n💾 2. DATABASE CONNECTION\n")

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    check("db", "supabase-connection", "fail", "Chybí env vars")
    return null
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )

  try {
    // Test 1: venues
    const { count: venuesCount, error: venuesErr } = await supabase
      .from("venues")
      .select("*", { count: "exact", head: true })
    if (venuesErr) throw venuesErr
    check("db", "venues table", "ok", `${venuesCount} záznamů`)
    console.log(`   ✓ venues: ${venuesCount} záznamů`)

    // Test 2: inquiries
    const { count: inqCount, error: inqErr } = await supabase
      .from("inquiries")
      .select("*", { count: "exact", head: true })
    if (inqErr) throw inqErr
    check("db", "inquiries table", "ok", `${inqCount} záznamů`)
    console.log(`   ✓ inquiries: ${inqCount} záznamů`)

    // Test 3: site_settings
    const { data: settings, error: setErr } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .single()
    if (setErr) throw setErr
    check("db", "site_settings table", "ok", `${Object.keys(settings ?? {}).length} polí`)
    console.log(`   ✓ site_settings: ${Object.keys(settings ?? {}).length} polí`)

    return supabase
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    check("db", "supabase-connection", "fail", msg)
    console.log(`   ✗ Connection error: ${msg}`)
    return null
  }
}

/* ─────────── 3. VENUES DATA QUALITY ─────────── */

async function checkVenuesData(supabase: ReturnType<typeof createClient>) {
  console.log("\n🏰 3. VENUES DATA QUALITY\n")

  const { data } = await supabase.from("venues").select("*")
  if (!data) return
  const venues = data as Record<string, unknown>[]

  const total = venues.length
  const vips = venues.filter((v) => v.is_featured).length
  console.log(`   Celkem: ${total}, z toho VIP: ${vips}`)
  check("venues", "total count", total >= 100 ? "ok" : "warn", `${total} míst (potřeba 100+)`)
  check("venues", "vip count", vips >= 20 ? "ok" : "warn", `${vips} VIP (potřeba 20+)`)

  const fields = {
    "region": venues.filter((v) => v.region).length,
    "type": venues.filter((v) => v.type).length,
    "nearest_city": venues.filter((v) => v.nearest_city).length,
    "catering_policy": venues.filter((v) => v.catering_policy).length,
    "night_party_policy": venues.filter((v) => v.night_party_policy).length,
    "accommodation_capacity > 0": venues.filter((v) => (v.accommodation_capacity ?? 0) > 0).length,
    "description (>50 znaků)": venues.filter((v) => (typeof v.description === "string" ? v.description : "").length > 50).length,
    "features (≥3)": venues.filter((v) => Array.isArray(v.features) && v.features.length >= 3).length,
    "website_url": venues.filter((v) => v.website_url).length,
  }

  for (const [name, count] of Object.entries(fields)) {
    const pct = Math.round((count / total) * 100)
    const status: "ok" | "warn" | "fail" = pct >= 80 ? "ok" : pct >= 50 ? "warn" : "fail"
    check("venues", name, status, `${count}/${total} (${pct}%)`)
    const icon = status === "ok" ? "✓" : status === "warn" ? "⚠" : "✗"
    console.log(`   ${icon} ${name.padEnd(35)} ${count}/${total} (${pct}%)`)
  }

  // Reprezentace krajů
  console.log(`\n   📍 Kraje reprezentace:`)
  const regionsCount: Record<string, number> = {}
  for (const v of venues) {
    const r = String(v.region ?? "—")
    regionsCount[r] = (regionsCount[r] ?? 0) + 1
  }
  for (const [r, c] of Object.entries(regionsCount).sort((a, b) => b[1] - a[1])) {
    console.log(`      ${r.padEnd(25)} ${c}× ${c >= 5 ? "✓" : "⚠"}`)
  }
}

/* ─────────── 4. SETTINGS LOAD ─────────── */

async function checkSettings(supabase: ReturnType<typeof createClient>) {
  console.log("\n⚙️ 4. SITE SETTINGS\n")

  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single()

  if (error) {
    check("settings", "load", "fail", error.message)
    console.log(`   ✗ Load error: ${error.message}`)
    return
  }

  const keys = Object.keys(data ?? {})
  const filledKeys = keys.filter((k) => {
    const v = (data as Record<string, unknown>)[k]
    return typeof v === "string" && v.length > 0
  })

  check("settings", "load", "ok", `${keys.length} sloupců`)
  check("settings", "filled fields", filledKeys.length > 20 ? "ok" : "warn",
    `${filledKeys.length}/${keys.length} vyplněných`)

  console.log(`   ✓ Načteno ${keys.length} sloupců, z toho ${filledKeys.length} vyplněných`)

  // Klíčové texty
  const critical = ["heroEyebrow", "heroTitleLine1", "heroSubtitle", "phone", "email"]
  for (const k of critical) {
    const v = (data as Record<string, unknown>)[k] ?? (data as Record<string, unknown>)[k.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase())]
    if (v) console.log(`      ${k.padEnd(20)} = "${String(v).substring(0, 40)}"`)
  }
}

/* ─────────── 5. AI / ANTHROPIC ─────────── */

async function checkAi() {
  console.log("\n🤖 5. CLAUDE AI (ANTHROPIC)\n")

  if (!process.env.ANTHROPIC_API_KEY) {
    check("ai", "api key", "fail", "Chybí ANTHROPIC_API_KEY")
    console.log(`   ✗ Chybí ANTHROPIC_API_KEY`)
    return
  }

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default
    const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await claude.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 50,
      messages: [{ role: "user", content: 'Odpovez jen "ok" pokud me slysis.' }],
    })

    const text = response.content.find((b) => b.type === "text")
    if (text && text.type === "text" && text.text.toLowerCase().includes("ok")) {
      check("ai", "claude sonnet 4.5", "ok", "Odpovídá")
      console.log(`   ✓ Claude Sonnet 4.5 odpovídá`)
      console.log(`      Tokens: input ${response.usage.input_tokens}, output ${response.usage.output_tokens}`)
    } else {
      check("ai", "claude sonnet 4.5", "warn", "Neočekávaný formát")
      console.log(`   ⚠ Neočekávaný formát odpovědi`)
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    check("ai", "claude sonnet 4.5", "fail", msg)
    console.log(`   ✗ Claude error: ${msg}`)
  }
}

/* ─────────── 6. RESEND EMAIL ─────────── */

async function checkResend() {
  console.log("\n📧 6. RESEND EMAIL\n")

  if (!process.env.RESEND_API_KEY) {
    check("email", "resend api key", "warn", "Chybí — e-maily se nebudou posílat")
    console.log(`   ⚠ RESEND_API_KEY chybí v .env.local`)
    console.log(`      → potřebuju aspoň na produkci ve Vercel`)
    return
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    check("email", "from email", "warn", "Chybí — použije onboarding@resend.dev")
    console.log(`   ⚠ RESEND_FROM_EMAIL chybí`)
  }
  if (!process.env.RESEND_TO_EMAIL) {
    check("email", "to email", "warn", "Chybí — firma nedostane notifikaci")
    console.log(`   ⚠ RESEND_TO_EMAIL chybí`)
  }

  try {
    const Resend = (await import("resend")).Resend
    const r = new Resend(process.env.RESEND_API_KEY)
    // Test: list domains (basic auth test, neposílá nic)
    const test = await r.domains.list()
    if ("error" in test && test.error) {
      check("email", "resend connection", "fail", test.error.message)
      console.log(`   ✗ Resend auth error: ${test.error.message}`)
    } else {
      check("email", "resend connection", "ok", "API klíč funguje")
      console.log(`   ✓ Resend API klíč funguje`)
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    check("email", "resend connection", "fail", msg)
    console.log(`   ✗ Resend error: ${msg}`)
  }
}

/* ─────────── 7. AI MAPPING LOGIC ─────────── */

async function checkLogic() {
  console.log("\n🧠 7. LOGIKA (geografie, validace, vokativ)\n")

  // Geografie
  try {
    const { isRegionWithin90Min, REGIONS_WITHIN_90MIN } = await import("../lib/geography")
    const tests = [
      ["Středočeský", "Praha", true],
      ["Moravskoslezský", "Ostrava", true],
      ["Moravskoslezský", "Praha", false],
      ["Olomoucký", "Ostrava", true],
    ] as const
    let passed = 0
    for (const [region, city, expected] of tests) {
      const got = isRegionWithin90Min(region as never, city as never)
      const ok = got === expected
      if (ok) passed++
      console.log(`   ${ok ? "✓" : "✗"} ${region} ↔ ${city}: ${got} (expected ${expected})`)
    }
    check("logic", "geography", passed === tests.length ? "ok" : "fail", `${passed}/${tests.length} testů`)
    console.log(`   Pokrytí: ${Object.keys(REGIONS_WITHIN_90MIN).length} center`)
  } catch (e) {
    check("logic", "geography", "fail", String(e))
  }

  // Vokativ
  try {
    const { toCzechVocative } = await import("../lib/czech-vocative")
    const tests: [string, string][] = [
      ["Petr", "Petře"], ["Pavel", "Pavle"], ["Monika", "Moniko"],
      ["Lukáš", "Lukáši"], ["Jana", "Jano"], ["Marek", "Marku"],
    ]
    let passed = 0
    for (const [input, expected] of tests) {
      const got = toCzechVocative(input)
      const ok = got === expected
      if (ok) passed++
      console.log(`   ${ok ? "✓" : "✗"} "${input}" → "${got}" (expected "${expected}")`)
    }
    check("logic", "vokativ", passed === tests.length ? "ok" : "fail", `${passed}/${tests.length} testů`)
  } catch (e) {
    check("logic", "vokativ", "fail", String(e))
  }

  // venue-mapping
  try {
    const { mapDbToVenue } = await import("../lib/venue-mapping")
    const dbRow = {
      id: "1", title: "Test", slug: "test",
      price_from: 100000, is_featured: true,
      catering_policy: "own_free",
      accommodation_capacity: 50,
      nearest_city: "Praha",
    }
    const v = mapDbToVenue(dbRow as Record<string, unknown>)
    const checks = [
      v.priceFrom === 100000, v.isFeatured === true,
      v.cateringPolicy === "own_free",
      v.accommodationCapacity === 50,
      v.nearestCity === "Praha",
    ]
    const passed = checks.filter(Boolean).length
    check("logic", "venue mapping", passed === checks.length ? "ok" : "fail", `${passed}/${checks.length}`)
    console.log(`   ${passed === checks.length ? "✓" : "✗"} mapDbToVenue: ${passed}/${checks.length} polí`)
  } catch (e) {
    check("logic", "venue mapping", "fail", String(e))
  }

  // Policy describers
  try {
    const { describeCatering, describeNightParty } = await import("../lib/venue-policies")
    const cat = describeCatering("own_free")
    const party = describeNightParty("no_curfew")
    const negotiable = describeCatering("negotiable")
    const ok =
      cat.variant === "positive" &&
      party.variant === "positive" &&
      negotiable.variant === "negotiable"
    check("logic", "policy describers", ok ? "ok" : "fail")
    console.log(`   ${ok ? "✓" : "✗"} describeCatering/Party: ok`)
  } catch (e) {
    check("logic", "policy describers", "fail", String(e))
  }
}

/* ─────────── 8. SHRNUTÍ ─────────── */

function printSummary() {
  console.log("\n" + "═".repeat(70))
  console.log("📊 SHRNUTÍ HEALTH CHECK")
  console.log("═".repeat(70))

  const byCategory: Record<string, CheckResult[]> = {}
  for (const r of results) {
    byCategory[r.category] = byCategory[r.category] ?? []
    byCategory[r.category].push(r)
  }

  const totals = { ok: 0, warn: 0, fail: 0 }
  for (const [cat, items] of Object.entries(byCategory)) {
    const counts = { ok: 0, warn: 0, fail: 0 }
    for (const i of items) counts[i.status]++
    totals.ok += counts.ok
    totals.warn += counts.warn
    totals.fail += counts.fail
    const icon = counts.fail > 0 ? "🔴" : counts.warn > 0 ? "🟡" : "🟢"
    console.log(
      `${icon} ${cat.padEnd(15)} ✓ ${counts.ok}  ⚠ ${counts.warn}  ✗ ${counts.fail}`,
    )
  }

  console.log("─".repeat(70))
  console.log(`✓ ${totals.ok}   ⚠ ${totals.warn}   ✗ ${totals.fail}`)

  if (totals.fail > 0) {
    console.log("\n❌ KRITICKÉ CHYBY:")
    for (const r of results.filter((r) => r.status === "fail")) {
      console.log(`   ✗ [${r.category}] ${r.name}: ${r.detail ?? ""}`)
    }
  }
  if (totals.warn > 0) {
    console.log("\n⚠ VAROVÁNÍ:")
    for (const r of results.filter((r) => r.status === "warn")) {
      console.log(`   ⚠ [${r.category}] ${r.name}: ${r.detail ?? ""}`)
    }
  }

  console.log("\n" + (totals.fail > 0 ? "❌ ALE NĚCO NEFUNGUJE — NUTNO OPRAVIT" : totals.warn > 0 ? "🟡 PRODUKČNĚ POJEDETE, ALE NĚCO LZE DOLADIT" : "✅ VŠECHNO V POŘÁDKU"))
}

/* ─────────── MAIN ─────────── */

async function main() {
  console.log("═".repeat(70))
  console.log("🏥 HEALTH CHECK — Svatební Místa.cz")
  console.log("═".repeat(70))

  await checkEnv()
  const supabase = await checkDatabase()
  if (supabase) {
    await checkVenuesData(supabase)
    await checkSettings(supabase)
  }
  await checkAi()
  await checkResend()
  await checkLogic()

  printSummary()
}

main().catch((e) => { console.error("\n❌ FATAL:", e); process.exit(1) })
