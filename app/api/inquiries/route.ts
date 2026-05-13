import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { mapDbToInquiry } from "@/lib/venue-mapping"

export async function GET() {
  // Diagnostika — zjistíme, zda je SERVICE_ROLE_KEY skutečně nastaven na Vercel
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  if (!hasServiceKey) {
    console.warn("[/api/inquiries] SUPABASE_SERVICE_ROLE_KEY chybí — admin neuvidí cizí poptávky kvůli RLS")
  }

  const { data, error } = await supabaseAdmin
    .from("inquiries")
    .select("*, venues(title)")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[/api/inquiries] Supabase error:", error)
    return NextResponse.json(
      { error: error.message, hint: hasServiceKey ? undefined : "Nastav SUPABASE_SERVICE_ROLE_KEY na Vercelu" },
      { status: 500 },
    )
  }

  console.log(`[/api/inquiries] Načteno ${data?.length ?? 0} poptávek (service key: ${hasServiceKey ? "ANO" : "NE"})`)

  const mapped = (data ?? []).map(mapDbToInquiry)
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
