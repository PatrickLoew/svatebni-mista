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

  // Načteme název místa, abychom ho mohli použít v předmětu e-mailu
  let venueName = "(neznámé místo)"
  try {
    const { data: venue } = await supabaseAdmin
      .from("venues")
      .select("title")
      .eq("id", body.venueId)
      .single()
    if (venue?.title) venueName = venue.title
  } catch {
    // neblokující — když se nepodaří, použijeme placeholder
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

  // E-maily přes Resend (firma + klient)
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend")
      const resend = new Resend(process.env.RESEND_API_KEY)
      const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"
      const toFirma = process.env.RESEND_TO_EMAIL

      // 1) E-mail firmě (pokud RESEND_TO_EMAIL nastaveno)
      if (toFirma) {
        await resend.emails.send({
          from: fromEmail,
          to: toFirma,
          subject: `Nová poptávka: ${venueName} — ${body.name}`,
          html: `
            <div style="font-family:Helvetica,Arial,sans-serif;background:#F9F6F0;padding:32px;color:#222">
              <h2 style="margin:0 0 16px;color:#3E2723">Nová poptávka místa</h2>
              <p style="color:#444">Klient vyplnil poptávku přes detail místa:</p>
              <table cellpadding="8" style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;border:1px solid #ddd;margin-top:12px">
                <tr><td><strong>Místo:</strong></td><td>${venueName}</td></tr>
                <tr><td><strong>Jméno:</strong></td><td>${body.name}</td></tr>
                <tr><td><strong>E-mail:</strong></td><td><a href="mailto:${body.email}">${body.email}</a></td></tr>
                <tr><td><strong>Telefon:</strong></td><td><a href="tel:${body.phone}">${body.phone}</a></td></tr>
                <tr><td><strong>Datum svatby:</strong></td><td>${body.weddingDate}</td></tr>
                <tr><td><strong>Počet hostů:</strong></td><td>${body.guests}</td></tr>
                <tr><td><strong>Zpráva:</strong></td><td>${body.message ?? "—"}</td></tr>
              </table>
            </div>
          `,
        })
      }

      // 2) Potvrzovací e-mail klientovi
      await resend.emails.send({
        from: fromEmail,
        to: body.email,
        subject: `Vaše poptávka byla přijata — ${venueName}`,
        html: `
          <div style="font-family:Helvetica,Arial,sans-serif;background:#F9F6F0;padding:40px 20px">
            <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden">
              <div style="background:#3E2723;padding:40px;text-align:center;color:#fff">
                <p style="margin:0 0 12px;color:#E8C98A;font-size:11px;letter-spacing:3px;text-transform:uppercase">Poptávka místa</p>
                <h1 style="margin:0;font-family:Georgia,serif;font-weight:300;font-size:28px">Děkujeme, ${(body.name as string).split(" ")[0]}</h1>
              </div>
              <div style="padding:32px;color:#444;line-height:1.7;font-size:15px">
                <p>Vaši poptávku místa <strong>${venueName}</strong> jsme přijali.</p>
                <p>Náš tým ji předá majiteli místa, který se Vám ozve do <strong>24 hodin</strong> s konkrétními detaily a dostupností termínů.</p>
                <table cellpadding="6" style="margin-top:16px;background:#F9F2E6;border-radius:8px;width:100%">
                  <tr><td><strong>Místo:</strong></td><td>${venueName}</td></tr>
                  <tr><td><strong>Datum svatby:</strong></td><td>${body.weddingDate}</td></tr>
                  <tr><td><strong>Počet hostů:</strong></td><td>${body.guests}</td></tr>
                </table>
                <p style="margin-top:20px;color:#999;font-size:13px">Otázky? Napište na <a href="mailto:${toFirma ?? "svatebnimista@svatebnimista.cz"}" style="color:#C9A96E">${toFirma ?? "svatebnimista@svatebnimista.cz"}</a></p>
              </div>
              <div style="background:#1F1310;padding:20px;text-align:center;color:rgba(255,255,255,.4);font-size:11px">© Svatební Místa.cz</div>
            </div>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error("Email error:", emailErr)
    }
  }

  return NextResponse.json(data, { status: 201 })
}
