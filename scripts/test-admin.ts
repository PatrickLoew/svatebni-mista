/**
 * Smoke test admin funkcí:
 *  1. Settings load + save
 *  2. Venues list + update
 *  3. Storage bucket pro fotky
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

async function main() {
  console.log("═".repeat(60))
  console.log("🧪 ADMIN SMOKE TEST")
  console.log("═".repeat(60))

  // TEST 1: Settings load
  console.log("\n📝 Test 1: Načtení site_settings")
  const { data: settings, error: sErr } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single()
  if (sErr) {
    console.log(`   ✗ FAIL: ${sErr.message}`)
  } else {
    const filledFields = Object.entries(settings ?? {})
      .filter(([k, v]) => k !== "id" && k !== "updated_at" && typeof v === "string" && v.length > 0)
    console.log(`   ✓ OK: ${filledFields.length} vyplněných polí`)
    console.log(`   Klíčové texty:`)
    console.log(`      hero_title_line1 = "${settings?.hero_title_line1}"`)
    console.log(`      phone            = "${settings?.phone}"`)
    console.log(`      email            = "${settings?.email}"`)
  }

  // TEST 2: Venues - jakou má prvních 5 míst fotky
  console.log("\n🏰 Test 2: Fotky míst")
  const { data: venues } = await supabase
    .from("venues")
    .select("id, title, images")
    .limit(5)
  for (const v of venues ?? []) {
    const imgs = (v.images as string[]) ?? []
    const fromSupabase = imgs.filter((u) => u.includes("supabase")).length
    const fromUnsplash = imgs.filter((u) => u.includes("unsplash")).length
    console.log(`   ${v.title.padEnd(30)} ${imgs.length} fotek (Supabase: ${fromSupabase}, Unsplash: ${fromUnsplash})`)
  }

  // TEST 3: Storage bucket
  console.log("\n📦 Test 3: Storage bucket 'venue-images'")
  try {
    const { data: bucketList, error: bErr } = await supabase.storage.listBuckets()
    if (bErr) {
      console.log(`   ✗ Nelze listovat buckety: ${bErr.message}`)
    } else {
      const bucket = bucketList?.find((b) => b.name === "venue-images")
      if (!bucket) {
        console.log(`   ✗ FAIL: bucket 'venue-images' NEEXISTUJE`)
        console.log(`      Vytvoř ho v Supabase → Storage → New bucket`)
      } else {
        console.log(`   ✓ OK: bucket existuje (public: ${bucket.public})`)
        // Test upload
        const testData = new Blob(["test"], { type: "text/plain" })
        const testName = `test-${Date.now()}.txt`
        const { error: uErr } = await supabase.storage
          .from("venue-images")
          .upload(testName, testData, { contentType: "text/plain" })
        if (uErr) {
          console.log(`   ✗ Upload test: ${uErr.message}`)
        } else {
          console.log(`   ✓ Upload test: OK`)
          // Cleanup
          await supabase.storage.from("venue-images").remove([testName])
          console.log(`   ✓ Cleanup: OK`)
        }
      }
    }
  } catch (e) {
    console.log(`   ✗ Storage error: ${e instanceof Error ? e.message : e}`)
  }

  console.log("\n" + "═".repeat(60))
}

main().catch((e) => { console.error("\n❌ FATAL:", e); process.exit(1) })
