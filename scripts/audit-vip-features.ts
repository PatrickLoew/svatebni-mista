/**
 * Audit features u VIP míst — co tam je, co chybí.
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
  const { data } = await supabase
    .from("venues")
    .select("title, features, website_url")
    .eq("is_featured", true)
    .order("title")

  console.log("⭐ FEATURES VIP MÍST\n")
  console.log("═".repeat(80))

  const allKeywords = new Set<string>()
  for (const v of data ?? []) {
    const features = (v.features as string[]) ?? []
    console.log(`\n📍 ${v.title}  ${v.website_url ? "(web ✓)" : "(NEMÁ web)"}`)
    console.log(`   ${features.length === 0 ? "(žádné features)" : features.join(" · ")}`)
    features.forEach((f) => allKeywords.add(f))
  }

  console.log("\n" + "═".repeat(80))
  console.log(`\n📊 Unikátních features napříč VIP: ${allKeywords.size}\n`)
  console.log([...allKeywords].sort().join("\n"))
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1) })
