/**
 * Vyhledávání klíčových slov klienta ve features + popisu míst.
 *
 * Klient napíše: "Chceme bazén pro děti a možnost psa."
 * → Funkce vrátí pro každé místo skóre 0–N podle počtu shod
 *   v features a popisu (case-insensitive, normalizováno).
 */
import type { Venue } from "./types"

/**
 * Mapování klientových klíčových slov → klíčová slova v DB features/popisu.
 * Když klient řekne A, ve features/popisu se hledá kterékoli z B.
 */
const KEYWORD_MAP: { client: string[]; match: string[] }[] = [
  {
    client: ["bazén", "bazen", "koupání", "koupani", "koupací", "koupaci"],
    match: ["bazén", "biotop", "koupací jezírko", "bazén / biotop", "venkovní bazén", "vyhřívaný bazén"],
  },
  {
    client: ["biotop"],
    match: ["biotop", "koupací jezírko", "přírodní bazén"],
  },
  {
    client: ["rybník", "rybnik", "rybníček", "rybnicek", "jezírko", "jezirko", "u vody"],
    match: ["rybník", "jezírko", "u vody", "biotop", "rybník", "u vody / rybník"],
  },
  {
    client: ["pejsek", "pes", "psi", "psy", "psa", "pet", "pet-friendly"],
    match: ["pejsek vítán", "pet-friendly", "pet friendly", "psi vítáni", "psi povoleni", "pejsek"],
  },
  {
    client: ["děti", "deti", "dětský", "detsky", "dětsk"],
    match: ["dětský koutek", "dětské hřiště", "hřiště pro děti", "rodinné", "dětsk"],
  },
  {
    client: ["wellness", "spa"],
    match: ["wellness", "spa", "wellness & spa"],
  },
  {
    client: ["sauna", "vířivka", "virivka"],
    match: ["sauna", "vířivka", "finská sauna", "parní sauna"],
  },
  {
    client: ["bezbariér", "bezbarier", "vozíček", "vozicek"],
    match: ["bezbariérovost", "bezbariér", "bezbariérový"],
  },
  {
    client: ["samota", "klid", "soukromí", "soukromi"],
    match: ["samota", "soukromý areál", "klidné", "soukromí", "soukromý areál / samota"],
  },
  {
    client: ["příroda", "priroda", "v přírodě", "v prirode"],
    match: ["příroda", "v přírodě", "příroda kolem", "u vody", "louka", "les"],
  },
  {
    client: ["hory", "horský", "horsky", "výhled", "vyhled"],
    match: ["hory", "horský výhled", "výhled", "horská lokalita"],
  },
  {
    client: ["zahrada", "park"],
    match: ["zahrada", "park", "francouzská zahrada"],
  },
  {
    client: ["stodola"],
    match: ["stodola"],
  },
  {
    client: ["vinný sklep", "vinny sklep", "víno", "vino", "vinař"],
    match: ["vinný sklep", "vinařství", "víno"],
  },
  {
    client: ["pivovar"],
    match: ["pivovar"],
  },
  {
    client: ["luxus", "luxusní", "luxusni"],
    match: ["luxus", "luxusní ubytování", "boutique"],
  },
]

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // odstranit háčky/čárky
    .trim()
}

/**
 * Extrahuje klíčová slova klienta ze textu (specialRequests).
 * Vrací názvy "kategorií" (např. "bazén", "psi", "děti"...).
 */
export function extractClientKeywords(text: string): string[] {
  if (!text) return []
  const lowerText = normalize(text)
  const matched: string[] = []
  for (const entry of KEYWORD_MAP) {
    for (const kw of entry.client) {
      if (lowerText.includes(normalize(kw))) {
        // První client keyword z entry = jeho "kategorie"
        matched.push(entry.client[0])
        break
      }
    }
  }
  return matched
}

/**
 * Pro dané místo spočítá kolik klientových klíčových slov je v features + popisu.
 * Vrací: { score: počet shod, matchedKeywords: string[] }
 */
export function matchVenueAgainstKeywords(
  venue: Venue,
  clientKeywords: string[],
): { score: number; matched: string[] } {
  if (clientKeywords.length === 0) return { score: 0, matched: [] }

  const haystack = normalize(
    [
      ...(venue.features ?? []),
      venue.description ?? "",
      ...(venue.services ?? []),
    ].join(" "),
  )

  const matched: string[] = []
  for (const clientKw of clientKeywords) {
    const entry = KEYWORD_MAP.find((e) => e.client[0] === clientKw)
    if (!entry) continue
    for (const dbKw of entry.match) {
      if (haystack.includes(normalize(dbKw))) {
        matched.push(clientKw)
        break
      }
    }
  }

  return { score: matched.length, matched }
}

/**
 * Seřadí venues podle počtu shod klíčových slov klienta.
 * Místa s nejvíc shodami jdou první.
 */
export function rankVenuesByKeywords(
  venues: Venue[],
  specialRequests: string,
): Venue[] {
  const clientKw = extractClientKeywords(specialRequests)
  if (clientKw.length === 0) return venues
  return [...venues]
    .map((v) => ({ v, ...matchVenueAgainstKeywords(v, clientKw) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.v)
}
