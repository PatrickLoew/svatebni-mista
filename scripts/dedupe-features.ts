/**
 * Sjednocení duplicitních features napříč všemi venues.
 * Příklad: "Bazén" + "Bazén / biotop" + "bazén" → vše na "Bazén".
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

/**
 * Mapa duplicit → kanonický název.
 * Vlevo: variantní zápisy, vpravo: jednotný standard.
 */
const CANONICAL: Record<string, string> = {
  "bazén": "Bazén",
  "Bazén / biotop": "Bazén",
  "Biotop / přírodní koupání": "Biotop",
  "Koupací jezírko": "Biotop",
  "Jezírko": "Rybník / jezírko",
  "Jezírko na koupání": "Biotop",
  "Rybníček / jezírko": "Rybník / jezírko",
  "U vody / rybník": "Rybník / jezírko",
  "Poloha u vody": "Rybník / jezírko",
  "Wellness & Spa": "Wellness",
  "Dětský koutek / Hřiště pro děti": "Dětský koutek",
  "Vybavení pro děti": "Dětský koutek",
  "Soukromý areál / samota": "Soukromý areál",
  "Samota / klid": "Soukromý areál",
  "Klidné prostředí": "Soukromý areál",
  "Prostředí uprostřed přírody": "Příroda kolem",
  "Přírodní prostředí u lesa": "Příroda kolem",
  "Příroda": "Příroda kolem",
  "Les": "Příroda kolem",
  "Horská lokalita": "Horský výhled",
  "Vlastní catering povolen": "Vlastní catering",
  "Historický statek": "Historický objekt",
  "Historický kaštieľ": "Historický objekt",
  "Historická budova": "Historický objekt",
  "Zámeček / zámek": "Historický objekt",
  "Kostel": "Kostel / kaple",
  "Luxus": "Luxusní ubytování",
  "Venkovní posezení s grilem": "Terasa",
}

function canonize(features: string[]): string[] {
  const out = new Set<string>()
  for (const f of features) {
    const canonical = CANONICAL[f] ?? f
    out.add(canonical)
  }
  return [...out]
}

async function main() {
  console.log("🔧 Sjednocení duplicitních features...\n")

  const { data } = await supabase.from("venues").select("id, title, features")
  if (!data) return

  let changed = 0
  for (const v of data) {
    const features = (v.features as string[]) ?? []
    if (features.length === 0) continue

    const deduped = canonize(features)
    // Pokud po deduplikaci je seznam jiný (kratší nebo přesunutý)
    if (deduped.length !== features.length || deduped.some((f, i) => f !== features[i])) {
      const removed = features.filter((f) => !deduped.includes(f) || CANONICAL[f])
      if (removed.length === 0) continue

      const { error } = await supabase.from("venues").update({ features: deduped }).eq("id", v.id)
      if (!error) {
        changed++
        console.log(`✓ ${v.title}: ${features.length} → ${deduped.length} features`)
      }
    }
  }

  console.log(`\n✅ Sjednoceno ${changed} míst`)
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1) })
