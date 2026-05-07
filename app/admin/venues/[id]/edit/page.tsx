import { supabaseAdmin } from "@/lib/supabase"
import VenueForm from "@/components/admin/VenueForm"
import { notFound } from "next/navigation"
import type { Venue } from "@/lib/types"

async function getVenue(id: string): Promise<Venue | null> {
  const { data } = await supabaseAdmin.from("venues").select("*").eq("id", id).single()
  if (!data) return null
  return { ...data, priceFrom: data.price_from, isFeatured: data.is_featured, createdAt: data.created_at }
}

export default async function EditVenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const venue = await getVenue(id)
  if (!venue) notFound()

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold mb-1">Upravit místo</h1>
        <p className="text-charcoal/60 text-sm">{venue.title}</p>
      </div>
      <div className="bg-white rounded-2xl border border-[#E8DDD0] p-8">
        <VenueForm initial={venue} id={id} />
      </div>
    </div>
  )
}
