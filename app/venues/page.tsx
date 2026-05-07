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
  let query = supabase.from("venues").select("*").order("is_featured", { ascending: false })

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
          ✦ Katalog ✦
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold mb-4">
          Svatební místa
        </h1>
        <div className="divider-gold mb-5" />
        <p className="text-charcoal/60 max-w-xl mx-auto">
          Prozkoumejte naši sbírku pečlivě vybraných míst pro váš výjimečný den.
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
          <p className="text-sm">Zkuste změnit filtry nebo přidat místa v admin panelu.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-charcoal/50 mb-6">
            Nalezeno <strong className="text-charcoal">{venues.length}</strong> míst
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {venues.map((v, i) => (
              <VenueCard key={v.id} venue={v} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
