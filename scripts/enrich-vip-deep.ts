/**
 * HLOUBKOVÉ obohacení VIP míst — AI cíleně hledá speciální požadavky
 * (wellness, bazén, spa, jezírko, psi, děti, sauna, ...) na webu každého místa.
 *
 * Rozšíření enrich-vip-from-web.ts:
 *   - Cílený prompt na 16 kategorií klíčových slov (z keyword-matcher.ts)
 *   - AI vrací mapping kategorie → konkrétní text z webu
 *   - Sjednocené názvy features (žádné duplicity: "Bazén" vs "Bazén / biotop")
 *   - Sloučí staré + nové features (nezahodí ručně přidané)
 *
 * Cena: ~1,5 Kč × 22 VIP ≈ 35 Kč jednorázově. Idempotentní.
 *
 * Použití: npm run enrich-vip-deep
 */
import fs from "fs"
import path from "path"
import { createClient } from "@supabase/supabase-js"
import Anthropic from "@anthropic-ai/sdk"

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
const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const MAX_HTML = 60_000
const MAX_TEXT = 15_000
const FETCH_TIMEOUT = 20_000

/**
 * Kategorie features, které AI cíleně hledá.
 * Standardizovaný název (vlevo) = co se uloží do DB.
 * Klíčová slova (vpravo) = co AI hledá v textu webu.
 */
const FEATURE_CATEGORIES: { label: string; keywords: string[] }[] = [
  { label: "Wellness",           keywords: ["wellness", "spa", "wellness & spa", "spa centrum"] },
  { label: "Bazén",              keywords: ["bazén", "bazen", "venkovní bazén", "vyhřívaný bazén", "krytý bazén"] },
  { label: "Biotop / přírodní koupání", keywords: ["biotop", "koupací jezírko", "přírodní bazén", "přírodní koupání"] },
  { label: "Rybník / jezírko",   keywords: ["rybník", "jezírko", "u vody", "u rybníka"] },
  { label: "Sauna",              keywords: ["sauna", "finská sauna", "parní sauna", "infrasauna"] },
  { label: "Vířivka",            keywords: ["vířivka", "jacuzzi", "whirlpool"] },
  { label: "Pejsek vítán",       keywords: ["pejsek vítán", "pet-friendly", "pet friendly", "psi vítáni", "psi povoleni", "se psem"] },
  { label: "Dětský koutek",      keywords: ["dětský koutek", "dětské hřiště", "hřiště pro děti", "pro děti", "atrakce pro děti"] },
  { label: "Bezbariérovost",     keywords: ["bezbariér", "bezbariérový", "bezbariérovost", "wheelchair"] },
  { label: "Soukromý areál",     keywords: ["soukromý areál", "samota", "v soukromí", "areál jen pro sebe"] },
  { label: "Zahrada",            keywords: ["zahrada", "park", "francouzská zahrada", "anglická zahrada"] },
  { label: "Stodola",            keywords: ["stodola"] },
  { label: "Vinný sklep",        keywords: ["vinný sklep", "vinařství", "vinotéka"] },
  { label: "Pivovar",            keywords: ["pivovar", "vlastní pivo"] },
  { label: "Krb",                keywords: ["krb", "krbová kamna"] },
  { label: "Terasa",             keywords: ["terasa", "venkovní posezení"] },
  { label: "Klimatizace",        keywords: ["klimatizace", "ac"] },
  { label: "Horský výhled",      keywords: ["horský výhled", "výhled na hory", "horská lokalita"] },
  { label: "Příroda kolem",      keywords: ["v přírodě", "uprostřed přírody", "v lese", "u lesa"] },
  { label: "Ubytování přímo",    keywords: ["ubytování přímo", "ubytování na místě", "ubytování v areálu"] },
  { label: "Vlastní catering",   keywords: ["vlastní catering", "catering povolen", "vlastní jídlo"] },
  { label: "Bez nočního klidu",  keywords: ["bez nočního klidu", "žádný noční klid", "do rána"] },
  { label: "Parkování",          keywords: ["parkování", "parking", "vlastní parkoviště"] },
  { label: "Kostel / kaple",     keywords: ["kostel", "kaple", "kaplička"] },
  { label: "Luxusní ubytování",  keywords: ["luxusní ubytování", "boutique hotel", "5*", "5 hvězd"] },
]

interface EnrichedData {
  features: string[]
  description: string
  notes: string
}

function cleanHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim()
}

async function fetchSite(url: string): Promise<string | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "cs-CZ,cs;q=0.9,en;q=0.8",
      },
      signal: controller.signal,
      redirect: "follow",
    })
    clearTimeout(timeout)
    if (!resp.ok) return null
    return (await resp.text()).substring(0, MAX_HTML)
  } catch {
    clearTimeout(timeout)
    return null
  }
}

async function extractFeatures(
  title: string,
  url: string,
  text: string,
  existingFeatures: string[],
): Promise<EnrichedData | null> {
  const categoriesList = FEATURE_CATEGORIES
    .map((c) => `- "${c.label}": hledej zmínku o "${c.keywords.join('", "')}"`)
    .join("\n")

  const prompt = `Jsi specialista na svatební místa. Z textu webu místa cíleně hledej speciální požadavky klientů a vrať JSON.

NÁZEV: ${title}
URL: ${url}
EXISTUJÍCÍ FEATURES V DB: ${existingFeatures.length > 0 ? existingFeatures.join(", ") : "(žádné)"}

TEXT Z WEBU (zkrácený):
"""
${text.substring(0, MAX_TEXT)}
"""

ÚKOL — CÍLENĚ HLEDEJ tyto kategorie speciálních požadavků:

${categoriesList}

PRAVIDLA:
1. Vrať JEN kategorie, které jsi ve textu **SKUTEČNĚ NAŠEL**. Nevymýšlej.
2. Pro každou kategorii použij PŘESNĚ standardizovaný název (label v uvozovkách)
3. Pokud na webu není zmíněna jedna z kategorií, NEZAHRNUJ ji.
4. Plus napiš krátkou poznámku co konkrétně tě k dané feature dovedlo (pro audit)
5. Plus vrať description — 3-5 vět v Mončině stylu (vřelý, bez emotikonů)

PŘÍKLAD VÝSTUPU:
{
  "features": ["Wellness", "Bazén", "Pejsek vítán", "Zahrada", "Stodola"],
  "description": "Krásné místo s jedinečnou atmosférou. Velkou výhodou je wellness centrum, venkovní bazén a možnost vzít s sebou pejska.",
  "notes": "Wellness: web říká 'spa centrum s vířivkou'. Bazén: 'venkovní vyhřívaný bazén'. Pejsek: 'pet-friendly'. Zahrada: 'francouzská zahrada'."
}

Vrať POUZE čistý JSON (žádný markdown, žádný text okolo).`

  try {
    const resp = await claude.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    })
    const textBlock = resp.content.find((b) => b.type === "text")
    if (!textBlock || textBlock.type !== "text") return null

    let jsonText = textBlock.text.trim()
    const m = jsonText.match(/\{[\s\S]*\}/)
    if (m) jsonText = m[0]

    const parsed = JSON.parse(jsonText) as EnrichedData
    if (!Array.isArray(parsed.features)) return null

    // Validace: feature MUSÍ být v našem seznamu kategorií
    const validLabels = new Set(FEATURE_CATEGORIES.map((c) => c.label))
    parsed.features = parsed.features.filter((f) => validLabels.has(f))

    return parsed
  } catch (e) {
    console.error(`   ❌ Claude: ${e instanceof Error ? e.message : e}`)
    return null
  }
}

async function main() {
  console.log("🔍 HLOUBKOVÉ obohacení VIP míst — cílené hledání speciálních požadavků\n")

  const { data } = await supabase
    .from("venues")
    .select("id, title, website_url, description, features")
    .eq("is_featured", true)
    .order("title")

  const vips = (data ?? []).filter((v) => v.website_url)
  console.log(`📊 ${vips.length} VIP míst s webem\n`)

  let updated = 0
  let totalNewFeatures = 0
  let skipped = 0

  for (let i = 0; i < vips.length; i++) {
    const v = vips[i]
    console.log(`\n[${i + 1}/${vips.length}] ⭐ ${v.title}`)
    console.log(`   🌐 ${v.website_url}`)

    const html = await fetchSite(v.website_url)
    if (!html) {
      console.log(`   ⏭ Nelze stáhnout web`)
      skipped++
      continue
    }
    const text = cleanHtml(html)
    if (text.length < 200) {
      console.log(`   ⏭ Text moc krátký (${text.length} znaků)`)
      skipped++
      continue
    }

    const oldFeatures = (v.features as string[]) ?? []
    const enriched = await extractFeatures(v.title, v.website_url, text, oldFeatures)
    if (!enriched) {
      skipped++
      continue
    }

    // Sloučit staré + nové (deduplikace)
    const merged = [...new Set([...oldFeatures, ...enriched.features])]
    const newOnes = enriched.features.filter((f) => !oldFeatures.includes(f))

    if (newOnes.length === 0) {
      console.log(`   ✓ Žádné nové features — DB už má co najít`)
      continue
    }

    console.log(`   ✓ Nové features: ${newOnes.join(", ")}`)
    if (enriched.notes) console.log(`   💬 ${enriched.notes}`)

    const updates: { features: string[]; description?: string } = { features: merged.slice(0, 15) }
    // Description přepiš jen pokud nový je delší
    if (enriched.description && enriched.description.length > (v.description ?? "").length + 50) {
      updates.description = enriched.description
    }

    const { error } = await supabase.from("venues").update(updates).eq("id", v.id)
    if (error) {
      console.error(`   ❌ DB: ${error.message}`)
    } else {
      updated++
      totalNewFeatures += newOnes.length
    }
  }

  console.log("\n" + "═".repeat(70))
  console.log(`✅ HOTOVO: ${updated} VIP aktualizováno, ${totalNewFeatures} nových features přidáno, ${skipped} přeskočeno`)
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1) })
