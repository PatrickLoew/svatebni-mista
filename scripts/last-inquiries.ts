/**
 * Vypíše posledních 5 poptávek z DB s plnými detaily,
 * abychom viděli co klient zadal a co AI vyhodnotila.
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
  const { data, error } = await supabase
    .from("inquiries")
    .select("name, email, message, created_at")
    .order("created_at", { ascending: false })
    .limit(5)

  if (error) { console.error("❌", error.message); process.exit(1) }

  for (const inq of data ?? []) {
    console.log("=".repeat(70))
    console.log(`👤 ${inq.name} | ${inq.email}`)
    console.log(`📅 ${inq.created_at}`)
    console.log("-".repeat(70))
    console.log(inq.message)
    console.log()
  }
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1) })
