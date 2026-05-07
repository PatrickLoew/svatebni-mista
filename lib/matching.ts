import type { Venue, Region, VenueType, NearestCity } from "./types"

export interface WizardAnswers {
  // Step 1: Termín & rozpočet
  weddingYear: number
  weddingMonth: number  // 0 = ještě nevíme
  flexibility: "presny-mesic" | "ten-rok" | "flexibilni"
  guests: number
  budget: number

  // Step 2: Lokalita
  regions: Region[]
  nearestCity?: NearestCity   // hlavně odkud přijedu

  // Step 3: Typ & atmosféra
  types: VenueType[]
  atmosphere: ("intimni" | "velkolepa" | "moderni" | "klasicka" | "rustikalni" | "luxusni")[]
  setting: "indoor" | "outdoor" | "both"

  // Step 4: Musí mít
  mustHave: string[]
  // možné hodnoty:
  //   catering, ubytovani, fotograf, parkovani, bezbarierovy,
  //   venkovni, deti, wellness,
  //   vlastni-piti     – vlastní pití bez poplatků
  //   bez-nocniho-klidu – party do rána
  //   ubytovani-na-miste – ubytování přímo na místě

  // Step 5: Volný text
  vision: string
  concerns: string

  // Step 6: Kontakt
  name: string
  email: string
  phone: string

  notRobot?: boolean
  honeypot?: string
}

export interface Match {
  venue: Venue
  score: number
  reasons: string[]
  warnings: string[]
}

export function scoreVenue(v: Venue, a: WizardAnswers): Match {
  const reasons: string[] = []
  const warnings: string[] = []
  let score = 0

  // 1) Region match (max 20)
  if (a.regions.length === 0) {
    score += 12
  } else if (a.regions.includes(v.region)) {
    score += 20
    reasons.push(`Místo se nachází v preferovaném kraji ${v.region}.`)
  } else {
    score += 4
    warnings.push(`Místo není v preferovaném kraji (${v.region}).`)
  }

  // 1b) Nejbližší město (max 10) — silný signál pro Pražany apod.
  if (a.nearestCity) {
    if (v.nearestCity === a.nearestCity) {
      score += 10
      reasons.push(`Snadná dostupnost z města ${a.nearestCity}.`)
    } else {
      score += 3
    }
  } else {
    score += 6
  }

  // 2) Typ (max 15)
  if (a.types.length === 0) {
    score += 10
  } else if (a.types.includes(v.type)) {
    score += 15
    reasons.push(`Typ "${v.type}" odpovídá vašemu vkusu.`)
  } else {
    score += 3
  }

  // 3) Kapacita (max 15)
  const ratio = a.guests / v.capacity
  if (ratio <= 0.5) {
    score += 6
    warnings.push(`Místo je velké pro ${a.guests} hostů (kapacita ${v.capacity}).`)
  } else if (ratio <= 0.85) {
    score += 15
    reasons.push(`Kapacita ${v.capacity} hostů vám sedne s rezervou.`)
  } else if (ratio <= 1.0) {
    score += 12
    reasons.push(`Kapacita ${v.capacity} hostů přesně odpovídá.`)
  } else {
    warnings.push(`Kapacita ${v.capacity} je nedostatečná pro ${a.guests} hostů.`)
  }

  // 4) Rozpočet (max 15)
  // Porovnáváme s avgWeddingCost (pokud je k dispozici), jinak s priceFrom*3
  const expectedCost = v.avgWeddingCost && v.avgWeddingCost > 0
    ? v.avgWeddingCost
    : v.priceFrom * 3
  const budgetRatio = expectedCost / a.budget
  if (budgetRatio <= 0.85) {
    score += 15
    reasons.push("Místo zapadá do rozpočtu s rezervou.")
  } else if (budgetRatio <= 1.05) {
    score += 12
    reasons.push("Místo přesně odpovídá rozpočtu.")
  } else if (budgetRatio <= 1.3) {
    score += 6
    warnings.push("Cena je o trochu vyšší než váš rozpočet.")
  } else {
    score += 1
    warnings.push("Cena výrazně překračuje rozpočet.")
  }

  // 5) Musí mít (max 25) — hlavní kritéria
  let mustScore = 0
  const matchedMusts: string[] = []

  for (const must of a.mustHave) {
    let hit = false

    switch (must) {
      case "catering":
        hit = v.cateringPolicy !== undefined
        break
      case "ubytovani":
      case "ubytovani-na-miste":
        hit = (v.accommodationCapacity ?? 0) >= a.guests * 0.4
        if (hit) matchedMusts.push(`ubytování pro ${v.accommodationCapacity} hostů na místě`)
        break
      case "vlastni-piti":
        hit = v.cateringPolicy === "own_free" || v.cateringPolicy === "own_drinks_free"
        if (hit) matchedMusts.push("vlastní pití bez poplatků")
        break
      case "bez-nocniho-klidu":
        hit = v.nightPartyPolicy === "no_curfew"
        if (hit) matchedMusts.push("party bez nočního klidu")
        break
      case "wellness":
        hit = (v.features ?? []).some((f) => f.toLowerCase().includes("wellness"))
          || (v.services ?? []).some((s) => s.toLowerCase().includes("wellness"))
          || (v.features ?? []).some((f) => f.toLowerCase().includes("sauna"))
        break
      case "parkovani":
        hit = (v.features ?? []).some((f) =>
          f.toLowerCase().includes("parkov") ||
          f.toLowerCase().includes("valet"))
        break
      case "deti":
        hit = (v.features ?? []).some((f) => f.toLowerCase().includes("dět"))
        break
      case "venkovni":
        hit = (v.features ?? []).some((f) =>
          f.toLowerCase().includes("zahrad") ||
          f.toLowerCase().includes("venku") ||
          f.toLowerCase().includes("obřad"))
          || v.type === "Pláž / Příroda" || v.type === "Zahrada"
        break
      case "fotograf":
        hit = (v.services ?? []).some((s) => s.toLowerCase().includes("fotograf"))
        break
      case "bezbarierovy":
        hit = (v.features ?? []).some((f) => f.toLowerCase().includes("bezbar"))
        break
    }

    if (hit) {
      mustScore += 25 / Math.max(a.mustHave.length, 1)
    }
  }

  score += Math.min(mustScore, 25)
  if (matchedMusts.length > 0) {
    reasons.push("Splněno: " + matchedMusts.join(", ") + ".")
  }

  // 6) Bonusy
  if (v.isFeatured) score += 3
  if (v.accommodationCapacity && v.accommodationCapacity >= a.guests * 0.6) score += 2

  return {
    venue: v,
    score: Math.min(Math.round(score), 100),
    reasons,
    warnings,
  }
}

export function findBestMatches(venues: Venue[], answers: WizardAnswers, top = 3): Match[] {
  const scored = venues.map((v) => scoreVenue(v, answers))
  return scored.sort((a, b) => b.score - a.score).slice(0, top)
}
