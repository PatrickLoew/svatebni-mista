export type Region =
  | "Praha"
  | "Středočeský"
  | "Jihočeský"
  | "Plzeňský"
  | "Karlovarský"
  | "Ústecký"
  | "Liberecký"
  | "Královéhradecký"
  | "Pardubický"
  | "Vysočina"
  | "Jihomoravský"
  | "Olomoucký"
  | "Zlínský"
  | "Moravskoslezský"
  | "Slovensko"

export type VenueType =
  | "Zámek"
  | "Vinný sklep"
  | "Hotel"
  | "Zahrada"
  | "Venkovský statek"
  | "Historická budova"
  | "Moderní prostor"
  | "Pláž / Příroda"

export type CateringPolicy =
  | "own_free"        // vlastní pití i jídlo zdarma
  | "own_drinks_free" // vlastní pití zdarma, jídlo od místa
  | "only_venue"      // pouze od místa
  | "negotiable"      // dle domluvy

export type NightPartyPolicy =
  | "no_curfew"        // žádný noční klid – party do rána
  | "indoor_after_22"  // po 22:00 přesun do party místnosti
  | "quiet_hours"      // klidná zóna (řídké)

export type NearestCity =
  | "Praha"
  | "Brno"
  | "České Budějovice"
  | "Plzeň"
  | "Hradec Králové"
  | "Ostrava"
  | "Olomouc"
  | "Liberec"

export interface Venue {
  id: string
  slug: string
  title: string
  description: string
  location: string
  region: Region
  type: VenueType
  capacity: number
  priceFrom: number
  services: string[]
  images: string[]
  features: string[]
  isFeatured: boolean
  createdAt: string

  // rozšířené reálné údaje
  websiteUrl?: string
  contactEmail?: string
  nearestCity?: NearestCity
  accommodationCapacity?: number     // počet lůžek na místě
  cateringPolicy?: CateringPolicy
  nightPartyPolicy?: NightPartyPolicy
  avgWeddingCost?: number             // průměrná cena celé svatby
}

export interface Inquiry {
  id: string
  venueId: string
  venueName?: string
  name: string
  email: string
  phone: string
  weddingDate: string
  guests: number
  message: string
  status: "new" | "contacted" | "confirmed" | "declined"
  createdAt: string
}

export interface VenueFilters {
  region?: Region | ""
  type?: VenueType | ""
  capacityMin?: number
  capacityMax?: number
  priceMax?: number
  search?: string
}
