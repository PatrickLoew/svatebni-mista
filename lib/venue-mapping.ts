/**
 * Single source of truth pro mapování DB venues → typovaný Venue.
 *
 * Supabase ukládá pole v snake_case (price_from, is_featured, ...),
 * ale náš TypeScript typ Venue používá camelCase (priceFrom, isFeatured, ...).
 *
 * BEZ TOHOTO MAPOVÁNÍ jsou pole undefined v UI, což způsobí defaultní
 * fallback hodnoty (např. "Ubytování v okolí" místo skutečných lůžek).
 *
 * Použij VŠUDE, kde tahas venues z DB:
 *   const { data } = await supabase.from("venues").select("*")
 *   const venues = (data ?? []).map(mapDbToVenue)
 */
import type { Venue, Inquiry } from "./types"

export function mapDbToVenue(data: Record<string, unknown>): Venue {
  return {
    ...data,
    priceFrom: data.price_from,
    isFeatured: data.is_featured,
    createdAt: data.created_at,
    accommodationCapacity: data.accommodation_capacity,
    cateringPolicy: data.catering_policy,
    nightPartyPolicy: data.night_party_policy,
    avgWeddingCost: data.avg_wedding_cost,
    nearestCity: data.nearest_city,
    websiteUrl: data.website_url,
    contactEmail: data.contact_email,
  } as Venue
}

/**
 * Mapování inquiry z DB. Podporuje vnořený relations objekt s venue titulkem
 * (z `select("*, venues(title)")`).
 */
export function mapDbToInquiry(
  data: Record<string, unknown> & { venues?: { title?: string } | null },
): Inquiry {
  return {
    ...data,
    venueName: data.venues?.title ?? "—",
    venueId: data.venue_id,
    weddingDate: data.wedding_date,
    createdAt: data.created_at,
  } as Inquiry
}
