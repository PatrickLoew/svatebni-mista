import { Suspense } from "react"
import type { Metadata } from "next"
import { supabase } from "@/lib/supabase"
import VenueCard from "@/components/venues/VenueCard"
import VenueFilters from "@/components/venues/VenueFilters"
import type { Venue } from "@/lib/types"

export const metadata: Metadata = {
  title: "Katalog svatebních míst",
  description: "Procházejte stovky prověřených svatebních míst v České republice. Filtrujte podle kraje, typu, kapacity a ceny.",
}

async function getVenues(params: Record<string, string>): Promise<Venue[]> {
  // Veřejný katalog zobrazuje JEN VIP (is_featured = true).
  // Ostatní místa jsou v DB pro AI vyhodnocení, ale klient je vidí
  // až na wedding-point.cz (náš plný katalog).
  let query = supabase
    .from("venues")
    .select("*")
    .eq("is_featured", true)
    .order("title", { ascending: true })

  if (params.region) query = query.eq("region", params.region)
  if (params.type) query = query.eq("type", params.type)
  if (params.capacity) query = query.lte("capacity", Number(params.capacity))
  if (params.search) {
    query = query.or(
      `title.ilike.%${params.search}%,location.ilike.%${params.search}%`
    )
  }

  const { data } = await query
  if (!data) return []

  return data.map((v) => ({
    ...v,
    priceFrom: v.price_from,
    isFeatured: v.is_featured,
    createdAt: v.created_at,
    accommodationCapacity: v.accommodation_capacity,
    cateringPolicy: v.catering_policy,
    nightPartyPolicy: v.night_party_policy,
    avgWeddingCost: v.avg_wedding_cost,
    nearestCity: v.nearest_city,
    websiteUrl: v.website_url,
    contactEmail: v.contact_email,
  }))
}

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const venues = await getVenues(params)

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-[#C9A96E] text-sm font-semibold tracking-widest uppercase mb-3">
          ✦ Naše VIP selekce ✦
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold mb-4">
          Prémiová svatební místa
        </h1>
        <div className="divider-gold mb-5" />
        <p className="text-charcoal/60 max-w-xl mx-auto">
          Pečlivě vybraná místa, která osobně doporučujeme. Naše prémiová selekce
          z více než 200 svatebních míst v České republice.
        </p>
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-24 skeleton rounded-2xl mb-8" />}>
        <VenueFilters />
      </Suspense>

      {/* Results */}
      {venues.length === 0 ? (
        <div className="text-center py-24 text-charcoal/50">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-semibold text-lg mb-2">Žádná místa nenalezena</p>
          <p className="text-sm">Zkuste změnit filtry.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-charcoal/50 mb-6">
            Nalezeno <strong className="text-charcoal">{venues.length}</strong> VIP míst
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {venues.map((v, i) => (
              <VenueCard key={v.id} venue={v} index={i} />
            ))}
          </div>
        </>
      )}

      {/* CTA — odkaz na wedding-point.cz pro plný katalog */}
      <div className="mt-20 bg-gradient-to-br from-[#3E2723] to-[#1F1310] rounded-3xl p-10 sm:p-14 text-center text-white relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#C9A96E]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-[#C9A96E]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <p className="text-[#E8C98A] text-xs font-semibold tracking-[.3em] uppercase mb-4">
            ✦ Hledáte víc možností? ✦
          </p>
          <h2 className="font-serif font-light text-3xl sm:text-4xl mb-5 leading-tight">
            Objevte všech <em className="text-[#E8C98A]">200+ míst</em> v ČR
          </h2>
          <p className="text-white/70 leading-relaxed mb-8 max-w-xl mx-auto">
            Na <strong className="text-white">Wedding-point.cz</strong> najdete náš plný katalog
            — přes 200 prověřených svatebních míst po celé České republice.
            Filtrujte podle kraje, kapacity, ceny a stylu.
          </p>
          <a
            href="https://wedding-point.cz"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#A88240] text-white font-medium px-8 py-4 rounded-full transition-colors"
          >
            Otevřít Wedding-point.cz →
          </a>
        </div>
      </div>
    </div>
  )
}
