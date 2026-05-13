import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import InquiryForm from "@/components/venues/InquiryForm"
import VenueCard from "@/components/venues/VenueCard"
import { formatPrice } from "@/lib/utils"
import { MapPin, Users, Banknote, CheckCircle, ChevronLeft, Utensils, Music, BedDouble, Handshake } from "lucide-react"
import type { Venue } from "@/lib/types"
import { describeCatering, describeNightParty, policyBadgeClasses } from "@/lib/venue-policies"

async function getVenue(slug: string): Promise<Venue | null> {
  const { data } = await supabase.from("venues").select("*").eq("slug", slug).single()
  if (!data) return null
  return { ...data, priceFrom: data.price_from, isFeatured: data.is_featured, createdAt: data.created_at }
}

async function getRelated(region: string, excludeId: string): Promise<Venue[]> {
  const { data } = await supabase
    .from("venues").select("*").eq("region", region).neq("id", excludeId).limit(3)
  if (!data) return []
  return data.map((v) => ({ ...v, priceFrom: v.price_from, isFeatured: v.is_featured, createdAt: v.created_at }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const venue = await getVenue(slug)
  if (!venue) return {}
  return {
    title: venue.title,
    description: venue.description.slice(0, 160),
    openGraph: { images: venue.images[0] ? [venue.images[0]] : [] },
  }
}

export default async function VenueDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const venue = await getVenue(slug)
  if (!venue) notFound()

  const related = await getRelated(venue.region, venue.id)

  return (
    <div className="min-h-screen pt-20">
      {/* Back */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <Link href="/venues" className="inline-flex items-center gap-1 text-sm text-charcoal/60 hover:text-[#C9A96E] transition-colors">
          <ChevronLeft size={16} /> Zpět na katalog
        </Link>
      </div>

      {/* Gallery */}
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-2xl overflow-hidden h-[420px]">
          {venue.images[0] && (
            <div className="md:col-span-2 relative h-full">
              <Image src={venue.images[0]} alt={venue.title} fill className="object-cover" sizes="66vw" priority />
            </div>
          )}
          <div className="flex flex-col gap-3">
            {venue.images.slice(1, 3).map((img, i) => (
              <div key={i} className="relative flex-1">
                <Image src={img} alt={`${venue.title} ${i + 2}`} fill className="object-cover" sizes="33vw" />
              </div>
            ))}
            {venue.images.length < 2 && <div className="flex-1 skeleton" />}
          </div>
        </div>
      </div>

      {/* Content + Sticky Form */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-12 pb-20">
        {/* Left: Details */}
        <div className="lg:col-span-2">
          {/* Title */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-[#C9A96E]/15 text-[#C9A96E] text-xs font-semibold px-3 py-1 rounded-full">{venue.type}</span>
              <span className="bg-[#E8DDD0] text-charcoal/70 text-xs font-semibold px-3 py-1 rounded-full">{venue.region}</span>
              {venue.isFeatured && <span className="bg-[#C9A96E] text-white text-xs font-semibold px-3 py-1 rounded-full">✦ Doporučeno</span>}
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold mb-3">{venue.title}</h1>
            <div className="flex items-center gap-1 text-charcoal/60">
              <MapPin size={15} />
              <span className="text-sm">{venue.location}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {[
              { icon: Users, label: "Kapacita", value: `až ${venue.capacity} hostů` },
              { icon: Banknote, label: "Cena od", value: formatPrice(venue.priceFrom) },
              { icon: MapPin, label: "Kraj", value: venue.region },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-[#E8DDD0] rounded-xl p-4">
                <div className="flex items-center gap-2 text-[#C9A96E] mb-1">
                  <s.icon size={15} />
                  <span className="text-xs text-charcoal/50 font-medium">{s.label}</span>
                </div>
                <div className="font-semibold text-charcoal text-sm">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="font-display text-xl font-semibold mb-3">O místě</h2>
            <p className="text-charcoal/70 leading-relaxed">{venue.description}</p>
          </div>

          {/* Catering & Party policies */}
          {(() => {
            const cat = describeCatering(venue.cateringPolicy)
            const party = describeNightParty(venue.nightPartyPolicy)
            const accom = venue.accommodationCapacity ?? 0
            return (
              <div className="mb-8">
                <h2 className="font-display text-xl font-semibold mb-4">Catering, party & ubytování</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Catering */}
                  <div className={`rounded-xl border-2 p-4 ${policyBadgeClasses(cat.variant)}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {cat.variant === "negotiable" ? <Handshake size={18} /> : <Utensils size={18} />}
                      <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Catering & pití</span>
                    </div>
                    <p className="font-semibold mb-1.5">{cat.label}</p>
                    <p className="text-xs leading-relaxed opacity-80">{cat.detail}</p>
                  </div>

                  {/* Party */}
                  <div className={`rounded-xl border-2 p-4 ${policyBadgeClasses(party.variant)}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {party.variant === "negotiable" ? <Handshake size={18} /> : <Music size={18} />}
                      <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Večerní party</span>
                    </div>
                    <p className="font-semibold mb-1.5">{party.label}</p>
                    <p className="text-xs leading-relaxed opacity-80">{party.detail}</p>
                  </div>

                  {/* Ubytování */}
                  <div className={`rounded-xl border-2 p-4 ${accom > 0 ? policyBadgeClasses("positive") : policyBadgeClasses("neutral")}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <BedDouble size={18} />
                      <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Ubytování</span>
                    </div>
                    <p className="font-semibold mb-1.5">
                      {accom > 0 ? `${accom} lůžek přímo na místě` : "Ubytování v okolí"}
                    </p>
                    <p className="text-xs leading-relaxed opacity-80">
                      {accom > 0
                        ? `Místo nabízí ubytování přímo v areálu pro ${accom} hostů.`
                        : "Místo samo nenabízí ubytování — k dispozici jsou ale možnosti v blízkém okolí."}
                    </p>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Services */}
          {venue.services.length > 0 && (
            <div className="mb-8">
              <h2 className="font-display text-xl font-semibold mb-4">Dostupné služby</h2>
              <div className="flex flex-wrap gap-2">
                {venue.services.map((s) => (
                  <span key={s} className="bg-[#F9F2E6] border border-[#C9A96E]/30 text-charcoal text-sm px-4 py-2 rounded-full font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          {venue.features.length > 0 && (
            <div className="mb-8">
              <h2 className="font-display text-xl font-semibold mb-4">Vybavení a vlastnosti</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {venue.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-charcoal/70">
                    <CheckCircle size={15} className="text-[#C9A96E] flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Sticky Form */}
        <div className="lg:col-span-1">
          <div className="sticky top-28">
            <InquiryForm venueId={venue.id} venueName={venue.title} />
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="bg-[#F9F2E6] py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-display text-2xl font-semibold mb-8 text-center">
              Další místa v kraji {venue.region}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((v, i) => <VenueCard key={v.id} venue={v} index={i} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
