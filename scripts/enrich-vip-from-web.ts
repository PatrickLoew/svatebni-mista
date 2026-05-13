/**
 * Obohacení VIP míst informacemi z jejich webových stránek.
 *
 * Postup pro každé z 22 VIP míst:
 *   1. Stáhne HTML z website_url
 *   2. Vyčistí HTML (odstraní tagy, scripty, styly)
 *   3. Pošle text Claude Sonnet 4.5, který extrahuje:
 *      - Bohatý popis v Mončině stylu (3-5 vět)
 *      - Konkrétní features (wellness, psi, bezbariér, sauna...)
 *      - Highlights ("Krásná zahrada", "Soukromý areál"...)
 *   4. Aktualizuje DB — popis přepíše jen pokud je delší/lepší,
 *      features doplní jen pokud chybí
 *
 * Cena: ~3-5 Kč za 1 web × 22 = ~80 Kč jednorázově.
 * Idempotentní: lze spouštět opakovaně.
 *
 * Použití: npm run enrich-vip-from-web
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

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("❌ Chybí ANTHROPIC_API_KEY v .env.local")
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const MAX_HTML_CHARS = 50_000     // limit pro stažený HTML
const MAX_TEXT_CHARS = 12_000     // limit pro text poslaný Claude
const FETCH_TIMEOUT_MS = 15_000   // 15s timeout na web

/* ─────────── HTML cleanup ─────────── */

/**
 * Vyčistí HTML — odstraní scripty, styly, tagy, ponechá text.
 * Jednoduchý regex-based přístup (žádné parsování DOM).
 */
function cleanHtml(html: string): string {
  return html
    // Odstranit script + style + jejich obsah
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
    // Odstranit HTML komentáře
    .replace(/<!--[\s\S]*?-->/g, " ")
    // Nahradit <br> a <p> za newline
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    // Odstranit zbylé tagy
    .replace(/<[^>]+>/g, " ")
    // HTML entity decoding (základní)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&[a-z]+;/gi, " ")
    // Redukce whitespace
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim()
}

async function fetchWebsite(url: string): Promise<string | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "cs-CZ,cs;q=0.9,en;q=0.8",
      },
      signal: controller.signal,
      redirect: "follow",
    })
    clearTimeout(timeout)
    if (!resp.ok) return null
    const html = await resp.text()
    return html.substring(0, MAX_HTML_CHARS)
  } catch {
    clearTimeout(timeout)
    return null
  }
}

/* ─────────── Claude extrakce ─────────── */

interface EnrichedData {
  description: string  // 3-5 vět v Mončině stylu
  features: string[]   // ["Wellness", "Pejsek vítán"...]
  highlights: string[] // ["Krásná zahrada s rybníčkem", ...]
}

async function extractFromWeb(
  title: string,
  url: string,
  text: string,
  existingDescription: string,
  existingFeatures: string[],
): Promise<EnrichedData | null> {
  const prompt = `Jsi specialista na svatební místa. Z textu webu místa vytvoř DATA pro náš katalog.

NÁZEV MÍSTA: ${title}
URL: ${url}

EXISTUJÍCÍ POPIS V DB: "${existingDescription || "(žádný)"}"
EXISTUJÍCÍ FEATURES: ${existingFeatures.length > 0 ? existingFeatures.join(", ") : "(žádné)"}

TEXT Z WEBU (může obsahovat menu, navigaci, marketing):
"""
${text.substring(0, MAX_TEXT_CHARS)}
"""

ÚKOL:
Vytáhni z webu autentické informace a vrať JSON:

1. **description** (3-5 vět) — krásný popis místa v Mončině stylu:
   - "Krásné místo s jedinečnou atmosférou…"
   - "Velkou výhodou je…"
   - "Ideální pro páry, které…"
   - Vykání, profesionální, vřelý tón. ŽÁDNÉ emotikony.
   - Vychází z REÁLNÉHO obsahu webu, ne smyšlené.
   - Pokud existující popis je dobrý, můžeš ho rozšířit (ne přepsat úplně jinak).

2. **features** (3-8 položek) — konkrétní vlastnosti z webu:
   Pokud najdeš v textu nebo můžeš odvodit z popisu, použij:
   - "Wellness", "Sauna", "Bazén", "Vířivka"
   - "Pejsek vítán" / "Pet friendly"
   - "Bezbariérovost"
   - "Dětský koutek" / "Hřiště pro děti"
   - "Soukromý areál", "Samota / klid"
   - "Zahrada", "Stodola", "Rybníček / jezírko"
   - "Krb", "Terasa", "Vinný sklep"
   - "Komplet vše na místě", "Ubytování přímo"
   - "Vlastní catering povolen"
   - "Bez nočního klidu"
   - "Výzdoba v ceně", "Mobiliář v ceně"
   - "Parkování", "Klimatizace"
   - JINÉ konkrétní podle textu

3. **highlights** (2-4 položky) — TOP věci, které dělají místo unikátním:
   - Konkrétní, akční, prodejné
   - Příklad: "Soukromý areál pro 80 hostů na samotě"
   - Příklad: "Wellness s biotopem na koupání"

DŮLEŽITÉ:
- ŽÁDNÉ emotikony nikde.
- Vychází z REÁLNÝCH informací na webu. Nevymýšlej.
- Pokud web obsahuje málo info → vrať co máš + features podle popisu.

Vrať JEN čistý JSON (žádný markdown):
{
  "description": "...",
  "features": ["...", "..."],
  "highlights": ["...", "..."]
}`

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    })

    const textBlock = response.content.find((b) => b.type === "text")
    if (!textBlock || textBlock.type !== "text") return null

    let jsonText = textBlock.text.trim()
    const m = jsonText.match(/\{[\s\S]*\}/)
    if (m) jsonText = m[0]

    const parsed = JSON.parse(jsonText) as EnrichedData
    if (!parsed.description || !Array.isArray(parsed.features)) return null

    return parsed
  } catch (e) {
    console.error(`   ❌ Claude error: ${e instanceof Error ? e.message : e}`)
    return null
  }
}

/* ─────────── HLAVNÍ ─────────── */

async function main() {
  console.log("🌐 Obohacení VIP míst z jejich webů\n")
  console.log("   Postup: stáhnout web → Claude extrahuje popis + features → aktualizace DB\n")

  // Načti všechna VIP s URL
  const { data, error } = await supabase
    .from("venues")
    .select("id, title, website_url, description, features")
    .eq("is_featured", true)

  if (error) { console.error("❌", error.message); process.exit(1) }
  const vips = (data ?? []).filter((v) => v.website_url)
  console.log(`📊 ${vips.length} VIP s webem\n`)

  let updated = 0
  let skipped = 0
  let errors = 0
  let descriptionImproved = 0
  let featuresAdded = 0

  for (let i = 0; i < vips.length; i++) {
    const v = vips[i]
    console.log(`\n[${i + 1}/${vips.length}] ⭐ ${v.title}`)
    console.log(`   🌐 ${v.website_url}`)

    // 1. Stáhnout web
    const html = await fetchWebsite(v.website_url!)
    if (!html) {
      console.log(`   ⏭ Nelze stáhnout web — přeskočeno`)
      skipped++
      continue
    }
    console.log(`   ✓ Staženo ${html.length} znaků HTML`)

    // 2. Vyčistit
    const cleanText = cleanHtml(html)
    if (cleanText.length < 200) {
      console.log(`   ⏭ Text moc krátký (${cleanText.length} z), přeskočeno`)
      skipped++
      continue
    }
    console.log(`   ✓ Vyčištěno na ${cleanText.length} znaků textu`)

    // 3. Claude extrahuje
    const enriched = await extractFromWeb(
      v.title,
      v.website_url!,
      cleanText,
      v.description ?? "",
      v.features ?? [],
    )

    if (!enriched) {
      errors++
      continue
    }

    // 4. Aktualizovat DB — popis přepsat jen pokud nový je delší/bohatší
    const oldDescLen = (v.description ?? "").length
    const newDescLen = enriched.description.length
    const oldFeatures = v.features ?? []

    const updates: Record<string, unknown> = {}

    if (newDescLen > oldDescLen + 50 || (oldDescLen < 100 && newDescLen > 100)) {
      updates.description = enriched.description
      descriptionImproved++
      console.log(`   ✓ Popis: ${oldDescLen} → ${newDescLen} znaků`)
    }

    // Sloučit features — zachovat staré + přidat nové unikátní
    const mergedFeatures = [...new Set([...oldFeatures, ...enriched.features])].slice(0, 10)
    if (mergedFeatures.length > oldFeatures.length) {
      updates.features = mergedFeatures
      featuresAdded += mergedFeatures.length - oldFeatures.length
      const newOnes = enriched.features.filter((f) => !oldFeatures.includes(f))
      console.log(`   ✓ Nové features: ${newOnes.join(", ")}`)
    }

    if (enriched.highlights && enriched.highlights.length > 0) {
      console.log(`   💎 Highlights: ${enriched.highlights.join(" | ")}`)
    }

    if (Object.keys(updates).length > 0) {
      const { error: upd } = await supabase.from("venues").update(updates).eq("id", v.id)
      if (upd) {
        console.error(`   ❌ DB update: ${upd.message}`)
        errors++
      } else {
        updated++
      }
    } else {
      console.log(`   ✓ Bez změny (data jsou již dobrá)`)
    }
  }

  console.log("\n" + "═".repeat(70))
  console.log("✅ ENRICH DOKONČEN\n")
  console.log(`   ${updated}× aktualizováno`)
  console.log(`   ${descriptionImproved}× popis vylepšen`)
  console.log(`   ${featuresAdded}× features přidáno`)
  console.log(`   ${skipped}× přeskočeno (nedostupný web / málo textu)`)
  console.log(`   ${errors}× error`)
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1) })
