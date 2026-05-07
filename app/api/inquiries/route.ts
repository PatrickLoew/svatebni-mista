import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("inquiries")
    .select("*, venues(title)")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const mapped = (data ?? []).map((r: { venues?: { title?: string }; [key: string]: unknown }) => ({
    ...r,
    venueName: (r.venues as { title?: string } | null)?.title ?? "—",
    venueId: r.venue_id,
    weddingDate: r.wedding_date,
    createdAt: r.created_at,
  }))

  return NextResponse.json(mapped)
}

export async function POST(req: Request) {
  const body = await req.json()

  // Validate required fields
  const required = ["venueId", "name", "email", "phone", "weddingDate", "guests"]
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Chybí pole: ${field}` }, { status: 400 })
    }
  }

  const { data, error } = await supabaseAdmin.from("inquiries").insert([{
    venue_id:    body.venueId,
    name:        body.name,
    email:       body.email,
    phone:       body.phone,
    wedding_date: body.weddingDate,
    guests:      Number(body.guests),
    message:     body.message ?? "",
    status:      "new",
  }]).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Optional: send email via Resend
  if (process.env.RESEND_API_KEY && process.env.RESEND_TO_EMAIL) {
    try {
      const { Resend } = await import("resend")
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from:    process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
        to:      process.env.RESEND_TO_EMAIL,
        subject: `Nová poptávka: ${body.name}`,
        html: `
          <h2>Nová poptávka ze Svatební místa</h2>
          <p><strong>Jméno:</strong> ${body.name}</p>
          <p><strong>E-mail:</strong> ${body.email}</p>
          <p><strong>Telefon:</strong> ${body.phone}</p>
          <p><strong>Datum svatby:</strong> ${body.weddingDate}</p>
          <p><strong>Počet hostů:</strong> ${body.guests}</p>
          <p><strong>Zpráva:</strong> ${body.message ?? "—"}</p>
        `,
      })
    } catch (emailErr) {
      console.error("Email error:", emailErr)
    }
  }

  return NextResponse.json(data, { status: 201 })
}
