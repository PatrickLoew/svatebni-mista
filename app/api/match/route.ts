import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { findBestMatches, type WizardAnswers, type Match } from "@/lib/matching"
import { SAMPLE_VENUES } from "@/lib/sample-venues"
import { validateEmail, validatePhone, validateName } from "@/lib/validation"
import type { Venue } from "@/lib/types"

const MONTHS = ["", "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
  "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"]

export async function POST(req: Request) {
  const answers: WizardAnswers = await req.json()

  // Bot protection
  if (answers.honeypot) {
    return NextResponse.json({ matches: [] }) // tichý úspěch pro boty
  }
  if (!answers.notRobot) {
    return NextResponse.json({ error: "Captcha nepotvrzená" }, { status: 400 })
  }

  // Validace — email povinný a v platném formátu
  const emailErr = validateEmail(answers.email)
  if (emailErr) return NextResponse.json({ error: emailErr }, { status: 400 })

  // Pokud klient nezadá jméno, použijeme generické oslovení
  if (!answers.name) {
    answers.name = "milí novomanželé"
  } else {
    const nameErr = validateName(answers.name)
    if (nameErr) return NextResponse.json({ error: nameErr }, { status: 400 })
  }

  // Telefon je volitelný, ale pokud zadán, musí být platný
  if (answers.phone) {
    const phoneErr = validatePhone(answers.phone, false)
    if (phoneErr) return NextResponse.json({ error: phoneErr }, { status: 400 })
  }

  // Načtení míst z DB s fallback na ukázková místa
  let venues: Venue[] = []
  try {
    const { data: rows } = await supabaseAdmin.from("venues").select("*")
    if (rows && rows.length > 0) {
      venues = rows.map((v) => ({
        ...v,
        priceFrom: v.price_from,
        isFeatured: v.is_featured,
        createdAt: v.created_at,
      }))
    }
  } catch {
    // Supabase nedostupné — použij sample
  }
  if (venues.length === 0) {
    venues = SAMPLE_VENUES
  }

  // Matching
  const matches = findBestMatches(venues, answers, 3)

  // Uložení poptávky do DB (jen pokud Supabase funguje)
  try {
    await supabaseAdmin.from("inquiries").insert([{
      venue_id: matches[0]?.venue.id?.startsWith("chateau") ? null : (matches[0]?.venue.id ?? null),
      name: answers.name,
      email: answers.email,
      phone: answers.phone || "—",
      wedding_date: answers.weddingYear
        ? `${answers.weddingYear}-${String(answers.weddingMonth || 1).padStart(2, "0")}-01`
        : null,
      guests: answers.guests,
      message: buildMessage(answers, matches),
      status: "new",
    }])
  } catch (e) {
    console.error("DB save error:", e)
  }

  // Odeslání e-mailů
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend")
      const resend = new Resend(process.env.RESEND_API_KEY)
      const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"

      await resend.emails.send({
        from: fromEmail,
        to: answers.email,
        subject: `Váš osobní návrh svatebních míst — ${answers.name.split(" ")[0]}`,
        html: clientEmail(answers, matches),
      })

      if (process.env.RESEND_TO_EMAIL) {
        await resend.emails.send({
          from: fromEmail,
          to: process.env.RESEND_TO_EMAIL,
          subject: `Nová poptávka přes wizard: ${answers.name}`,
          html: companyEmail(answers, matches),
        })
      }
    } catch (e) {
      console.error("Email error:", e)
    }
  }

  return NextResponse.json({ matches })
}

function termLabel(a: WizardAnswers): string {
  if (!a.weddingYear) return "termín ještě neupřesněn"
  if (a.weddingMonth === 0) return `${a.weddingYear}, měsíc nespecifikován`
  return `${MONTHS[a.weddingMonth]} ${a.weddingYear}`
}

function buildMessage(a: WizardAnswers, matches: Match[]): string {
  return [
    `Termín: ${termLabel(a)} (${a.flexibility})`,
    `Hostů: ${a.guests}`,
    `Rozpočet: ${a.budget.toLocaleString("cs-CZ")} Kč`,
    `Kraje: ${a.regions.join(", ") || "—"}`,
    `Typy: ${a.types.join(", ") || "—"}`,
    `Atmosféra: ${a.atmosphere.join(", ") || "—"}`,
    `Musí mít: ${a.mustHave.join(", ") || "—"}`,
    a.vision ? `Vize: ${a.vision}` : "",
    a.concerns ? `Priority: ${a.concerns}` : "",
    "",
    `TOP MATCH: ${matches[0]?.venue.title ?? "—"} (${matches[0]?.score ?? 0} %)`,
  ].filter(Boolean).join("\n")
}

const fmt = (n: number) => new Intl.NumberFormat("cs-CZ").format(n)

function clientEmail(a: WizardAnswers, matches: Match[]): string {
  const firstName = a.name.split(" ")[0]
  const term = termLabel(a)
  const venueBlocks = matches.map((m, i) => `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;background:#fff;border:1px solid #E8DDD0;border-radius:12px;overflow:hidden">
      <tr><td style="padding:0">
        ${m.venue.images[0] ? `<img src="${m.venue.images[0]}" width="100%" style="display:block;max-height:240px;object-fit:cover" />` : ""}
      </td></tr>
      <tr><td style="padding:24px">
        <p style="margin:0 0 4px;color:#C9A96E;font-size:11px;letter-spacing:2px;text-transform:uppercase">${i === 0 ? "★ Nejlepší shoda · " : ""}Shoda ${m.score} %</p>
        <h3 style="margin:0 0 8px;font-family:Georgia,serif;font-weight:300;font-size:22px;color:#3E2723">${m.venue.title}</h3>
        <p style="margin:0 0 16px;color:#666;font-size:14px">${m.venue.location} · do ${m.venue.capacity} hostů · od ${fmt(m.venue.priceFrom)} Kč</p>
        <p style="margin:0 0 12px;color:#444;line-height:1.6;font-size:14px">${m.venue.description}</p>
        ${m.reasons.length > 0 ? `
        <div style="background:#F9F2E6;padding:12px 16px;border-radius:8px;margin-top:12px">
          <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#3E2723">Proč právě toto místo:</p>
          <ul style="margin:0;padding-left:18px;color:#444;font-size:13px;line-height:1.6">
            ${m.reasons.map((r) => `<li>${r}</li>`).join("")}
          </ul>
        </div>` : ""}
      </td></tr>
    </table>
  `).join("")

  return `
  <div style="font-family:Helvetica,Arial,sans-serif;background:#F9F6F0;padding:40px 20px">
    <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden">
      <div style="background:#3E2723;padding:50px 40px;text-align:center;color:#fff">
        <p style="margin:0 0 12px;color:#E8C98A;font-size:11px;letter-spacing:3px;text-transform:uppercase">✦ Váš osobní návrh ✦</p>
        <h1 style="margin:0;font-family:Georgia,serif;font-weight:300;font-size:34px;line-height:1.2">Děkujeme, ${firstName}!</h1>
        <p style="margin:16px 0 0;color:rgba(255,255,255,.7);font-size:15px">Vybrali jsme pro vás 3 místa, která vám sednou nejlépe.</p>
      </div>
      <div style="padding:40px">
        <p style="margin:0 0 24px;color:#444;line-height:1.7;font-size:15px">
          Na základě vašich odpovědí (${term}, ${a.guests} hostů, rozpočet ${fmt(a.budget)} Kč) jsme prošli stovky míst v našem katalogu.
        </p>
        ${venueBlocks}
        <div style="background:#F9F2E6;padding:24px;border-radius:12px;text-align:center;margin-top:32px">
          <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:20px;color:#3E2723">Co bude dál?</p>
          <p style="margin:0 0 20px;color:#444;font-size:14px;line-height:1.6">Náš tým se vám ozve <strong>do 24 hodin</strong> s detailním rozpočtem, dostupností termínů a možností prohlídek.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://svatebni-mista.cz"}/venues" style="display:inline-block;background:#C9A96E;color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px">Prohlédnout celý katalog</a>
        </div>
        <p style="margin:32px 0 0;color:#999;font-size:12px;text-align:center;line-height:1.6">
          Otázky? Napište na <a href="mailto:info@svatebni-mista.cz" style="color:#C9A96E">info@svatebni-mista.cz</a> nebo zavolejte +420 123 456 789
        </p>
      </div>
      <div style="background:#1F1310;padding:24px;text-align:center;color:rgba(255,255,255,.4);font-size:11px">© Svatební Místa.cz</div>
    </div>
  </div>
  `
}

function companyEmail(a: WizardAnswers, matches: Match[]): string {
  return `
  <div style="font-family:Helvetica,Arial,sans-serif;background:#F9F6F0;padding:32px;color:#222">
    <h2 style="margin:0 0 16px">Nová poptávka z wizardu</h2>
    <table cellpadding="8" style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;border:1px solid #ddd">
      <tr><td><strong>Jméno:</strong></td><td>${a.name}</td></tr>
      <tr><td><strong>E-mail:</strong></td><td><a href="mailto:${a.email}">${a.email}</a></td></tr>
      <tr><td><strong>Telefon:</strong></td><td>${a.phone || "neuveden"}</td></tr>
      <tr><td><strong>Termín:</strong></td><td>${termLabel(a)} · ${a.flexibility}</td></tr>
      <tr><td><strong>Hostů:</strong></td><td>${a.guests}</td></tr>
      <tr><td><strong>Rozpočet:</strong></td><td>${fmt(a.budget)} Kč</td></tr>
      <tr><td><strong>Kraje:</strong></td><td>${a.regions.join(", ") || "—"}</td></tr>
      <tr><td><strong>Typy:</strong></td><td>${a.types.join(", ") || "—"}</td></tr>
      <tr><td><strong>Atmosféra:</strong></td><td>${a.atmosphere.join(", ") || "—"}</td></tr>
      <tr><td><strong>Musí mít:</strong></td><td>${a.mustHave.join(", ") || "—"}</td></tr>
      <tr><td><strong>Vize:</strong></td><td>${a.vision || "—"}</td></tr>
      <tr><td><strong>Priority:</strong></td><td>${a.concerns || "—"}</td></tr>
    </table>
    <h3 style="margin:24px 0 12px">Doporučená místa</h3>
    <ol>
      ${matches.map((m) => `<li><strong>${m.venue.title}</strong> — shoda ${m.score} %<br><small>${m.reasons.join(" · ") || "—"}</small></li>`).join("")}
    </ol>
  </div>
  `
}
