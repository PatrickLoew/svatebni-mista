import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { mapDbToVenue } from "@/lib/venue-mapping"

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("venues")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Mapování snake_case → camelCase, aby UI mělo správná pole (např. v adminu)
  const mapped = (data ?? []).map(mapDbToVenue)
  return NextResponse.json(mapped)
}

export async function POST(req: Request) {
  const body = await req.json()

  const { data, error } = await supabaseAdmin.from("venues").insert([{
    slug:        body.slug,
    title:       body.title,
    description: body.description,
    location:    body.location,
    region:      body.region,
    type:        body.type,
    capacity:    Number(body.capacity),
    price_from:  Number(body.priceFrom),
    services:    body.services ?? [],
    images:      body.images ?? [],
    features:    body.features ?? [],
    is_featured: body.isFeatured ?? false,
    website_url:           body.websiteUrl || null,
    contact_email:         body.contactEmail || null,
    nearest_city:          body.nearestCity || null,
    accommodation_capacity: body.accommodationCapacity ? Number(body.accommodationCapacity) : null,
    catering_policy:       body.cateringPolicy || null,
    night_party_policy:    body.nightPartyPolicy || null,
    avg_wedding_cost:      body.avgWeddingCost ? Number(body.avgWeddingCost) : null,
  }]).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
