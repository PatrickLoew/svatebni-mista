export function cn(...inputs: (string | false | null | undefined)[]) {
  return inputs.filter(Boolean).join(" ")
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export const REGIONS = [
  "Praha", "Středočeský", "Jihočeský", "Plzeňský", "Karlovarský",
  "Ústecký", "Liberecký", "Královéhradecký", "Pardubický", "Vysočina",
  "Jihomoravský", "Olomoucký", "Zlínský", "Moravskoslezský", "Slovensko",
] as const

export const VENUE_TYPES = [
  "Zámek", "Vinný sklep", "Hotel", "Zahrada",
  "Venkovský statek", "Historická budova", "Moderní prostor", "Pláž / Příroda",
] as const

export const NEAREST_CITIES = [
  "Praha", "Brno", "České Budějovice", "Plzeň",
  "Hradec Králové", "Ostrava", "Olomouc", "Liberec",
] as const

export const CATERING_LABELS = {
  own_free: "Vlastní jídlo i pití zdarma",
  own_drinks_free: "Vlastní pití zdarma, catering od místa",
  only_venue: "Pouze catering od místa",
  negotiable: "Dle domluvy",
} as const

export const PARTY_LABELS = {
  no_curfew: "Bez nočního klidu — party až do rána",
  indoor_after_22: "Po 22:00 v párty místnosti",
  quiet_hours: "Klidová zóna",
} as const

export const INQUIRY_STATUSES = {
  new: { label: "Nová", color: "bg-blue-100 text-blue-800" },
  contacted: { label: "Kontaktována", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Potvrzena", color: "bg-green-100 text-green-800" },
  declined: { label: "Zamítnuta", color: "bg-red-100 text-red-800" },
} as const
