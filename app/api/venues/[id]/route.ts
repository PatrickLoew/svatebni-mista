import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabaseAdmin.from("venues").select("*").eq("id", id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const { data, error } = await supabaseAdmin.from("venues").update({
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
  }).eq("id", id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabaseAdmin.from("venues").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
