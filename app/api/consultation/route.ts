import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { validateEmail, validatePhone, validateName } from "@/lib/validation"

interface ConsultationRequest {
  name: string
  email: string
  phone: string
  format: string
  timing: string
  message?: string
  source?: string
  honeypot?: string
  notRobot?: boolean
}

export async function POST(req: Request) {
  const body: ConsultationRequest = await req.json()

  // Bot protection
  if (body.honeypot) {
    return NextResponse.json({ ok: true }) // tichý úspěch pro boty
  }
  if (!body.notRobot) {
    return NextResponse.json({ error: "Captcha nepotvrzená" }, { status: 400 })
  }

  // Validation — back-end pojistka, kdyby někdo obešel front-end
  const nameErr = validateName(body.name)
  if (nameErr) return NextResponse.json({ error: nameErr }, { status: 400 })
  const emailErr = validateEmail(body.email)
  if (emailErr) return NextResponse.json({ error: emailErr }, { status: 400 })
  const phoneErr = validatePhone(body.phone)
  if (phoneErr) return NextResponse.json({ error: phoneErr }, { status: 400 })

  // Save jako inquiry s typem 'consultation'
  try {
    await supabaseAdmin.from("inquiries").insert([{
      venue_id:    null,
      name:        body.name,
      email:       body.email,
      phone:       body.phone,
      wedding_date: null,
      guests:      0,
      message: [
        `[KONZULTACE]`,
        `Forma: ${body.format}`,
        `Termín: ${body.timing}`,
        `Zdroj: ${body.source ?? "—"}`,
        body.message ? `\nZpráva: ${body.message}` : "",
      ].filter(Boolean).join("\n"),
      status: "new",
    }])
  } catch (e) {
    console.error("DB save error:", e)
  }

  // Email do firmy
  if (process.env.RESEND_API_KEY && process.env.RESEND_TO_EMAIL) {
    try {
      const { Resend } = await import("resend")
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
        to: process.env.RESEND_TO_EMAIL,
        subject: `Žádost o konzultaci: ${body.name}`,
        html: `
          <div style="font-family:Helvetica,Arial,sans-serif;background:#F9F6F0;padding:32px;color:#222">
            <h2 style="margin:0 0 16px">Nová žádost o konzultaci</h2>
            <table cellpadding="8" style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;border:1px solid #ddd">
              <tr><td><strong>Jméno:</strong></td><td>${body.name}</td></tr>
              <tr><td><strong>E-mail:</strong></td><td><a href="mailto:${body.email}">${body.email}</a></td></tr>
              <tr><td><strong>Telefon:</strong></td><td><a href="tel:${body.phone}">${body.phone}</a></td></tr>
              <tr><td><strong>Forma:</strong></td><td>${body.format}</td></tr>
              <tr><td><strong>Kdy:</strong></td><td>${body.timing}</td></tr>
              <tr><td><strong>Odkud:</strong></td><td>${body.source ?? "—"}</td></tr>
              ${body.message ? `<tr><td><strong>Zpráva:</strong></td><td>${body.message}</td></tr>` : ""}
            </table>
          </div>
        `,
      })

      // Potvrzovací e-mail klientovi
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
        to: body.email,
        subject: `Vaše žádost o konzultaci byla přijata — Svatební Místa.cz`,
        html: `
          <div style="font-family:Helvetica,Arial,sans-serif;background:#F9F6F0;padding:40px 20px">
            <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden">
              <div style="background:#3E2723;padding:40px;text-align:center;color:#fff">
                <p style="margin:0 0 12px;color:#E8C98A;font-size:11px;letter-spacing:3px;text-transform:uppercase">✦ Konzultace ✦</p>
                <h1 style="margin:0;font-family:Georgia,serif;font-weight:300;font-size:30px">Děkujeme, ${body.name.split(" ")[0]}!</h1>
              </div>
              <div style="padding:30px;color:#444;line-height:1.7;font-size:15px">
                <p>Vaši žádost o konzultaci jsme přijali.</p>
                <p>Náš specialista se vám ozve <strong>do 24 hodin</strong> s návrhem konkrétních termínů.</p>
                <table cellpadding="6" style="margin-top:16px;background:#F9F2E6;border-radius:8px;width:100%">
                  <tr><td><strong>Forma:</strong></td><td>${body.format}</td></tr>
                  <tr><td><strong>Kdy:</strong></td><td>${body.timing}</td></tr>
                </table>
                <p style="margin-top:20px;color:#999;font-size:13px">Otázky? Napište na <a href="mailto:svatebnimista@svatebnimista.cz" style="color:#C9A96E">svatebnimista@svatebnimista.cz</a></p>
              </div>
              <div style="background:#1F1310;padding:20px;text-align:center;color:rgba(255,255,255,.4);font-size:11px">© Svatební Místa.cz</div>
            </div>
          </div>
        `,
      })
    } catch (e) {
      console.error("Email error:", e)
    }
  }

  return NextResponse.json({ ok: true })
}
