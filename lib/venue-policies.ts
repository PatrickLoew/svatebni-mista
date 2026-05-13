/**
 * Human-friendly popisy policies pro zobrazení klientovi.
 *
 * Pravidlo "dle dohody":
 *   Pokud je policy "negotiable", klientovi to ukážeme jako pozitivní ("Dle dohody"),
 *   ne jako "nevíme". AI vyhodnocení tato místa NEVYLUČUJE — klient se může s místem
 *   domluvit na individuálním řešení.
 */
import type { CateringPolicy, NightPartyPolicy } from "./types"

export interface PolicyDisplay {
  label: string
  detail: string
  variant: "positive" | "neutral" | "warning" | "negotiable"
}

export function describeCatering(policy: CateringPolicy | null | undefined): PolicyDisplay {
  switch (policy) {
    case "own_free":
      return {
        label: "Vlastní catering bez poplatků",
        detail: "Můžete si přivést vlastní jídlo i pití bez jakýchkoliv příplatků.",
        variant: "positive",
      }
    case "own_drinks_free":
      return {
        label: "Vlastní pití bez poplatků",
        detail: "Vlastní pití (alkohol) bez příplatků. Jídlo zajišťuje místo nebo zvolený catering.",
        variant: "positive",
      }
    case "only_venue":
      return {
        label: "Catering od místa",
        detail: "Catering a nápoje zajišťuje přímo místo. Vlastní jídlo/pití není možné.",
        variant: "neutral",
      }
    case "negotiable":
    default:
      return {
        label: "Catering dle dohody",
        detail: "Konkrétní catering politika lze domluvit individuálně — místo je flexibilní.",
        variant: "negotiable",
      }
  }
}

export function describeNightParty(policy: NightPartyPolicy | null | undefined): PolicyDisplay {
  switch (policy) {
    case "no_curfew":
      return {
        label: "Bez nočního klidu",
        detail: "Žádné omezení noční hudby — party může pokračovat do rána.",
        variant: "positive",
      }
    case "indoor_after_22":
      return {
        label: "Po 22:00 přesun dovnitř",
        detail: "Hlasitá hudba venku do 22:00, poté pokračuje party v interiérech.",
        variant: "neutral",
      }
    case "quiet_hours":
      return {
        label: "Noční klid od 22:00",
        detail: "Místo respektuje noční klid. Party končí ve 22:00.",
        variant: "neutral",
      }
    case "negotiable":
    default:
      return {
        label: "Party dle dohody",
        detail: "Pravidla večerní party lze domluvit individuálně — místo je flexibilní.",
        variant: "negotiable",
      }
  }
}

/**
 * Vrátí Tailwind třídy pro vizuální styl badgeu.
 */
export function policyBadgeClasses(variant: PolicyDisplay["variant"]): string {
  switch (variant) {
    case "positive":
      return "bg-green-50 border-green-200 text-green-800"
    case "neutral":
      return "bg-charcoal/5 border-charcoal/15 text-charcoal/70"
    case "warning":
      return "bg-amber-50 border-amber-200 text-amber-900"
    case "negotiable":
      return "bg-[#F9F2E6] border-[#C9A96E]/40 text-[#A88240]"
  }
}
