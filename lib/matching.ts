import type { Venue, Region, NearestCity } from "./types"

/* ─────────── ENUMY pro otázky ─────────── */

export type Season = "leto" | "podzim" | "jaro" | "jedno" | "jine"
export type WeddingYear = 2026 | 2027 | 2028 | 0
export type VenueArchType =
  | "priroda" | "unikat" | "hotelovy" | "mlyn" | "industrial"
  | "hrad" | "zamek" | "jedno"
export type AccommodationType = "primo" | "okoli" | "neni" | "jine"
export type WeddingMode = "komplet" | "obrad-hostina" | "obrad-party" | "obrad" | "jine"
export type CateringPref = "vlastni-vse" | "vse-od-mista" | "vlastni-piti" | "jedno"
export type PartyPref = "velka-bez-klidu" | "pohoda" | "do-22" | "jedno"
export type RentalBudget = 50000 | 70000 | 100000 | 150000 | 200000 | 300000 | 0
export type WeddingBudget = 100000 | 200000 | 300000 | 500000 | 800000 | 0
export type ServiceHelp = "mista" | "dodavatele" | "vse"
export type YesNoMaybe = "ano" | "ne" | "uz-mam"

/* ─────────── WIZARD ANSWERS ─────────── */

export interface WizardAnswers {
  // Krok 1 — Termín
  season: Season
  weddingYear: WeddingYear
  guests: number

  // Krok 2 — Lokalita
  regions: Region[]
  nearestCity?: NearestCity | "jedno"

  // Krok 3 — Typ místa
  archType: VenueArchType
  accommodation: AccommodationType
  weddingMode: WeddingMode

  // Krok 4 — Servis
  catering: CateringPref
  party: PartyPref

  // Krok 5 — Rozpočet
  rentalBudget: RentalBudget
  weddingBudget: WeddingBudget

  // Krok 6 — Speciální požadavky + dodavatelé
  specialRequests: string
  serviceHelp: ServiceHelp[]
  needCoordinator: YesNoMaybe
  needDjModerator: YesNoMaybe
  needPhotographer: YesNoMaybe
  wantOnlineConsultation: boolean

  // Krok 7 — Kontakt + souhlasy
  name: string
  email: string
  phone: string
  consentGdpr: boolean
  consentNewsletter: boolean

  // Anti-bot
  notRobot?: boolean
  honeypot?: string
}

export interface Match {
  venue: Venue
  score: number
  reasons: string[]
  warnings: string[]
}

/* ─────────── MATCHING ALGORITMUS ─────────── */

/**
 * Skóre se počítá z 8 kritérií:
 *  - VIP bonus (0–15) — featured místa mají automaticky preferenci
 *  - Region (0–18)
 *  - Nearest city (0–10)
 *  - Architektonický typ (0–15)
 *  - Kapacita (0–18)
 *  - Catering policy (0–10)
 *  - Party policy (0–10)
 *  - Pronájem rozpočet (0–14)
 *  - Ubytování (0–10)
 */
export function scoreVenue(v: Venue, a: WizardAnswers): Match {
  const reasons: string[] = []
  const warnings: string[] = []
  let score = 0

  // 0) VIP bonus — featured místa mají preferenci
  if (v.isFeatured) {
    score += 15
    reasons.push("Toto je VIP místo z naší prémiové selekce.")
  }

  // 1) Region (0–18)
  if (a.regions.length === 0) {
    score += 12
  } else if (a.regions.includes(v.region)) {
    score += 18
    reasons.push(`Místo se nachází v preferovaném kraji ${v.region}.`)
  } else {
    score += 4
    warnings.push(`Místo není v preferovaném kraji (${v.region}).`)
  }

  // 2) Nejbližší město (0–10)
  if (!a.nearestCity || a.nearestCity === "jedno") {
    score += 6
  } else if (v.nearestCity === a.nearestCity) {
    score += 10
    reasons.push(`Snadno dostupné z města ${a.nearestCity}.`)
  } else {
    score += 3
  }

  // 3) Architektonický typ (0–15) — mapování na náš venue type
  const typeMap: Record<VenueArchType, string[]> = {
    priroda: ["Pláž / Příroda", "Zahrada"],
    unikat: ["Moderní prostor", "Historická budova"],
    hotelovy: ["Hotel"],
    mlyn: ["Venkovský statek"],
    industrial: ["Moderní prostor"],
    hrad: ["Zámek", "Historická budova"],
    zamek: ["Zámek"],
    jedno: [],
  }
  if (a.archType === "jedno") {
    score += 10
  } else if (typeMap[a.archType]?.includes(v.type)) {
    score += 15
    reasons.push(`Typ "${v.type}" odpovídá vašemu vkusu.`)
  } else {
    score += 4
  }

  // 4) Kapacita (0–18)
  const ratio = a.guests / v.capacity
  if (ratio <= 0.5) {
    score += 8
    warnings.push(`Místo je velké pro ${a.guests} hostů (kapacita ${v.capacity}).`)
  } else if (ratio <= 0.85) {
    score += 18
    reasons.push(`Kapacita ${v.capacity} hostů sedí s rezervou.`)
  } else if (ratio <= 1.0) {
    score += 14
    reasons.push(`Kapacita ${v.capacity} hostů přesně odpovídá.`)
  } else {
    warnings.push(`Kapacita ${v.capacity} je nedostatečná pro ${a.guests} hostů.`)
  }

  // 5) Catering policy (0–10)
  const cateringMap: Record<CateringPref, string[]> = {
    "vlastni-vse": ["own_free"],
    "vse-od-mista": ["only_venue"],
    "vlastni-piti": ["own_drinks_free", "own_free"],
    "jedno": ["own_free", "own_drinks_free", "only_venue", "negotiable"],
  }
  if (cateringMap[a.catering]?.includes(v.cateringPolicy ?? "")) {
    score += 10
    if (a.catering === "vlastni-vse") reasons.push("Vlastní jídlo i pití bez poplatků.")
    if (a.catering === "vlastni-piti") reasons.push("Vlastní pití povoleno bez poplatků.")
  } else {
    score += 3
  }

  // 6) Party policy (0–10)
  const partyMap: Record<PartyPref, string[]> = {
    "velka-bez-klidu": ["no_curfew"],
    "pohoda": ["no_curfew", "indoor_after_22"],
    "do-22": ["indoor_after_22", "quiet_hours"],
    "jedno": ["no_curfew", "indoor_after_22", "quiet_hours"],
  }
  if (partyMap[a.party]?.includes(v.nightPartyPolicy ?? "")) {
    score += 10
    if (a.party === "velka-bez-klidu" && v.nightPartyPolicy === "no_curfew")
      reasons.push("Žádný noční klid — party může jít do rána.")
  } else {
    score += 3
    if (a.party === "velka-bez-klidu" && v.nightPartyPolicy !== "no_curfew") {
      warnings.push("Toto místo má omezení nočního klidu.")
    }
  }

  // 7) Rozpočet pronájmu (0–14)
  if (a.rentalBudget === 0) {
    score += 9
  } else if (v.priceFrom <= a.rentalBudget) {
    score += 14
    reasons.push(`Pronájem (od ${v.priceFrom.toLocaleString("cs-CZ")} Kč) zapadá do rozpočtu.`)
  } else if (v.priceFrom <= a.rentalBudget * 1.2) {
    score += 7
    warnings.push("Pronájem je o trochu vyšší než váš rozpočet.")
  } else {
    score += 0
    warnings.push(`Pronájem je výrazně nad rozpočtem (od ${v.priceFrom.toLocaleString("cs-CZ")} Kč).`)
  }

  // 8) Ubytování (0–10)
  const accomCap = v.accommodationCapacity ?? 0
  if (a.accommodation === "primo") {
    if (accomCap >= a.guests * 0.4) {
      score += 10
      reasons.push(`Ubytování přímo na místě pro ${accomCap} hostů.`)
    } else if (accomCap > 0) {
      score += 5
      warnings.push(`Ubytování je k dispozici jen pro ${accomCap} hostů.`)
    } else {
      warnings.push("Místo nenabízí ubytování přímo na místě.")
    }
  } else if (a.accommodation === "okoli") {
    score += 8
  } else {
    score += 5
  }

  return {
    venue: v,
    score: Math.min(Math.round(score), 100),
    reasons,
    warnings,
  }
}

export function findBestMatches(venues: Venue[], answers: WizardAnswers, top = 3): Match[] {
  const scored = venues.map((v) => scoreVenue(v, answers))

  // Seřazeno čistě podle skóre (bez VIP preference jako prvním kritériem)
  const sortedByScore = [...scored].sort((a, b) => b.score - a.score)

  // Garantujeme: minimálně 1 VIP v TOP 3 doporučeních
  const vipMatches = sortedByScore.filter((m) => m.venue.isFeatured)
  const nonVipMatches = sortedByScore.filter((m) => !m.venue.isFeatured)

  const result: Match[] = []

  // Pokud máme alespoň jedno VIP místo, dáme ho na 1. pozici
  if (vipMatches.length > 0) {
    result.push(vipMatches[0])
  }

  // Doplníme nejlepší zbylé místa (mix VIP + non-VIP podle skóre)
  const remaining = sortedByScore.filter((m) => !result.includes(m))
  for (const m of remaining) {
    if (result.length >= top) break
    result.push(m)
  }

  return result
}
