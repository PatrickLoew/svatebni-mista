import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { findBestMatches, type WizardAnswers, type Match } from "@/lib/matching"
import { SAMPLE_VENUES } from "@/lib/sample-venues"
import { validateEmail, validatePhone, validateName } from "@/lib/validation"
import { evaluateWithClaude } from "@/lib/claude-ai"
import type { Venue } from "@/lib/types"

const MONTHS = ["", "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
  "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"]

export async function POST(req: Request) {
  // Robustní wrapping — i kdyby cokoliv selhalo, klient dostane success status
  try {
    const answers: WizardAnswers = await req.json()

    // Bot protection
    if (answers.honeypot) return NextResponse.json({ ok: true, matches: [] })
    if (!answers.notRobot) return NextResponse.json({ error: "Captcha nepotvrzená" }, { status: 400 })

    // Validace
    const emailErr = validateEmail(answers.email)
    if (emailErr) return NextResponse.json({ error: emailErr }, { status: 400 })

    if (!answers.name) {
      answers.name = "milí novomanželé"
    } else {
      const nameErr = validateName(answers.name)
      if (nameErr) return NextResponse.json({ error: nameErr }, { status: 400 })
    }

    if (answers.phone) {
      const phoneErr = validatePhone(answers.phone, false)
      if (phoneErr) return NextResponse.json({ error: phoneErr }, { status: 400 })
    }

    // Načtení míst z DB
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
    } catch (e) {
      console.error("DB venues error:", e)
    }
    if (venues.length === 0) {
      venues = SAMPLE_VENUES
    }

    // Matching — algoritmus
    let matches: Match[] = []
    try {
      matches = findBestMatches(venues, answers, 3)
    } catch (e) {
      console.error("Match error:", e)
    }

    // 🤖 CLAUDE AI: personalizované popisy
    let claudeResult: Awaited<ReturnType<typeof evaluateWithClaude>> = null
    if (matches.length > 0) {
      try {
        claudeResult = await evaluateWithClaude(answers, matches.map((m) => m.venue))
        if (claudeResult) {
          matches = matches.map((m) => {
            const cm = claudeResult!.matches.find((x) => x.slug === m.venue.slug)
            return cm ? { ...m, personalDescription: cm.personalDescription } : m
          })
        }
      } catch (e) {
        console.error("Claude error:", e)
      }
    }

    // Uložení poptávky do DB
    try {
      const seasonMonth: Record<string, number> = { leto: 7, podzim: 10, jaro: 4, jedno: 0, jine: 0 }
      const month = seasonMonth[answers.season] ?? 0
      await supabaseAdmin.from("inquiries").insert([{
        venue_id: matches[0]?.venue.id ?? null,
        name: answers.name,
        email: answers.email,
        phone: answers.phone || "—",
        wedding_date: answers.weddingYear && month
          ? `${answers.weddingYear}-${String(month).padStart(2, "0")}-01`
          : null,
        guests: answers.guests,
        message: buildMessage(answers, matches),
        status: "new",
      }])
    } catch (e) {
      console.error("DB save error:", e)
    }

    // Odeslání e-mailů (jen pokud Resend nastaven)
    if (process.env.RESEND_API_KEY && matches.length > 0) {
      try {
        const { Resend } = await import("resend")
        const resend = new Resend(process.env.RESEND_API_KEY)
        const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"

        await resend.emails.send({
          from: fromEmail,
          to: answers.email,
          subject: `Váš osobní návrh svatebních míst — ${answers.name.split(" ")[0]}`,
          html: clientEmail(answers, matches, claudeResult),
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

    return NextResponse.json({ ok: true, matches })
  } catch (e) {
    // I při kompletním selhání vrať success — poptávku můžeme zpracovat ručně
    console.error("Match API fatal:", e)
    return NextResponse.json({ ok: true, matches: [] })
  }
}

function termLabel(a: WizardAnswers): string {
  const seasonLabels: Record<string, string> = {
    leto: "léto", podzim: "podzim", jaro: "jaro", jedno: "kdykoliv", jine: "jiný termín",
  }
  return `${seasonLabels[a.season] ?? "—"} ${a.weddingYear || ""}`.trim()
}

function buildMessage(a: WizardAnswers, matches: Match[]): string {
  return [
    `Termín: ${termLabel(a)}`,
    `Hostů: ${a.guests}`,
    `Lokalita do 90 min od: ${a.nearestCity ?? "neuvedeno"}`,
    `Kraje: ${a.regions.join(", ") || "—"}`,
    `Typ místa: ${a.archType}`,
    `Způsob svatby: ${a.weddingMode}`,
    `Ubytování: ${a.accommodation}`,
    `Catering: ${a.catering}`,
    `Party: ${a.party}`,
    `Pronájem: ${a.rentalBudget ? "do " + a.rentalBudget.toLocaleString("cs-CZ") + " Kč" : "—"}`,
    `Rozpočet svatby: ${a.weddingBudget ? "do " + a.weddingBudget.toLocaleString("cs-CZ") + " Kč" : "—"}`,
    a.specialRequests ? `Speciální: ${a.specialRequests}` : "",
    `Pomoc s: ${a.serviceHelp.join(", ")}`,
    `Koordinátor: ${a.needCoordinator}`,
    `DJ: ${a.needDjModerator}`,
    `Foto: ${a.needPhotographer}`,
    a.wantOnlineConsultation ? "★ CHCE ONLINE KONZULTACI" : "",
    `Newsletter: ${a.consentNewsletter ? "ANO" : "NE"}`,
    "",
    `TOP MATCH: ${matches[0]?.venue.title ?? "—"} (${matches[0]?.score ?? 0} %)`,
  ].filter(Boolean).join("\n")
}

const fmt = (n: number) => new Intl.NumberFormat("cs-CZ").format(n)

/* ─────────── PERSONA SUMMARY (Monca styl) ─────────── */
function buildPersonaSummary(a: WizardAnswers): string {
  const term = termLabel(a)
  const parts: string[] = [
    `Podle Vašich představ hledáte svatební místo pro cca <strong>${a.guests} hostů</strong>`,
  ]
  if (a.nearestCity && a.nearestCity !== "jedno") {
    parts.push(`ideálně v rozumné dojezdové vzdálenosti od města <strong>${a.nearestCity}</strong>`)
  } else if (a.regions.length > 0) {
    parts.push(`v <strong>${a.regions.join(", ")}</strong> kraji`)
  }
  if (term && a.weddingYear) parts.push(`s plánovaným termínem na ${term}`)

  const arch: Record<string, string> = {
    priroda: "v přírodě (louka, les, u vody)",
    unikat: "v zajímavém a originálním prostředí",
    hotelovy: "v hotelovém stylu s komfortem",
    mlyn: "ve stylu mlýna, stodoly nebo statku",
    industrial: "v industriálním stylu",
    hrad: "na hradě",
    zamek: "v zámeckém prostředí",
  }
  if (arch[a.archType]) parts.push(arch[a.archType])

  const sentence1 = parts.join(", ") + "."

  // Druhý odstavec — preference
  const prefs: string[] = []
  if (a.weddingMode === "komplet") prefs.push("vše pohodlně na jednom místě — obřad, hostinu, ubytování i večerní party")
  if (a.catering === "vlastni-vse") prefs.push("možnost vlastního pití a jídla bez poplatků")
  if (a.catering === "vlastni-piti") prefs.push("možnost vlastního pití bez poplatků")
  if (a.party === "velka-bez-klidu") prefs.push("party bez omezení nočního klidu")
  if (a.party === "pohoda") prefs.push("pohodovou, příjemnou atmosféru bez velké party")
  if (a.accommodation === "primo") prefs.push("ubytování přímo v místě")

  const sentence2 = prefs.length > 0
    ? `Důležité je pro Vás <strong>${prefs.join("</strong>, <strong>")}</strong>.`
    : ""

  // Třetí — speciální
  const sentence3 = a.specialRequests
    ? `Velkým plusem je pro Vás také ${a.specialRequests}.`
    : ""

  return [sentence1, sentence2, sentence3].filter(Boolean).join(" ")
}

/* ─────────── CROSS-SELLS dle odpovědí ─────────── */
function buildCrossSells(a: WizardAnswers): string {
  const blocks: string[] = []

  if (a.needPhotographer === "ano") {
    blocks.push(`
      <div style="margin-top:32px;padding:24px;background:#F9F2E6;border-radius:12px">
        <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:18px;color:#3E2723">📸 Fotograf</p>
        <p style="margin:0 0 8px;color:#444;font-size:14px;line-height:1.6">Protože hledáte fotografa, rádi doporučíme:</p>
        <ul style="margin:0;padding-left:20px;color:#444;font-size:13px;line-height:1.8">
          <li><strong>Domculette Photo</strong> — přirozený a emotivní styl focení</li>
          <li><strong>Nikol Leitgeb Photography</strong></li>
          <li><strong>Patrik Borecký Photography</strong></li>
        </ul>
      </div>`)
  }
  if (a.needDjModerator === "ano") {
    blocks.push(`
      <div style="margin-top:24px;padding:24px;background:#F9F2E6;border-radius:12px">
        <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:18px;color:#3E2723">🎵 DJ a moderátor</p>
        <p style="margin:0;color:#444;font-size:14px;line-height:1.6">Velmi rádi doporučíme například <strong>Yes.Musicz</strong> nebo <strong>DJ Prague</strong> — oba opravdu top za rozumné ceny.</p>
      </div>`)
  }
  if (a.needCoordinator === "ano") {
    blocks.push(`
      <div style="margin-top:24px;padding:24px;background:#F9F2E6;border-radius:12px">
        <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:18px;color:#3E2723">📋 Koordinátorka</p>
        <p style="margin:0;color:#444;font-size:14px;line-height:1.6">Můžeme Vám doporučit prověřené koordinátorky, se kterými dlouhodobě spolupracujeme. Ozveme se s konkrétními tipy do 24 hodin.</p>
      </div>`)
  }
  return blocks.join("")
}

function clientEmail(
  a: WizardAnswers,
  matches: Match[],
  claude?: { personaSummary?: string; cashbackText?: string; signature?: string } | null
): string {
  const firstName = a.name.split(" ")[0] || "milí novomanželé"
  // Preferuj personalizovaný persona summary od Claude, fallback na algoritmus
  const personaSummary = claude?.personaSummary || buildPersonaSummary(a)
  const cashbackText = claude?.cashbackText || "Pokud si nakonec vyberete některé z míst, která jsme Vám doporučili, a dáte nám vědět, můžeme Vám u vybraných míst zajistit <strong>cashback ve výši 1 000 až 10 000 Kč</strong>."
  const signature = claude?.signature || "Mějte se krásně"
  const crossSells = buildCrossSells(a)

  const venueBlocks = matches.map((m, i) => {
    const isVip = m.venue.isFeatured
    const personalDesc = m.personalDescription ?? ""
    return `
    <div style="margin-bottom:24px;padding-bottom:24px;${i < matches.length - 1 ? "border-bottom:1px solid #E8DDD0;" : ""}">
      <h3 style="margin:0 0 6px;font-family:Georgia,serif;font-weight:400;font-size:20px;color:#3E2723">
        🌿 ${m.venue.title}
        ${isVip ? `<span style="background:linear-gradient(90deg,#A88240,#E8C98A);color:#fff;font-size:10px;letter-spacing:1px;padding:3px 8px;border-radius:10px;margin-left:6px;font-family:Helvetica;">★ DOPORUČUJEME</span>` : ""}
      </h3>
      <p style="margin:0 0 8px;color:#888;font-size:12px">${m.venue.location} · do ${m.venue.capacity} hostů · od ${fmt(m.venue.priceFrom)} Kč</p>
      <p style="margin:0;color:#444;line-height:1.6;font-size:14px">${personalDesc}</p>
      ${m.venue.websiteUrl ? `<p style="margin:8px 0 0"><a href="${m.venue.websiteUrl}" style="color:#C9A96E;font-size:12px;text-decoration:none">Web místa →</a></p>` : ""}
    </div>`
  }).join("")

  return `
  <div style="font-family:Helvetica,Arial,sans-serif;background:#F9F6F0;padding:40px 20px">
    <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden">
      <div style="background:#3E2723;padding:50px 40px;text-align:center;color:#fff">
        <p style="margin:0 0 12px;color:#E8C98A;font-size:11px;letter-spacing:3px;text-transform:uppercase">✦ Váš osobní návrh ✦</p>
        <h1 style="margin:0;font-family:Georgia,serif;font-weight:300;font-size:34px;line-height:1.2">Dobrý den, ${firstName} 😊</h1>
      </div>
      <div style="padding:40px">
        <p style="margin:0 0 16px;color:#444;line-height:1.7;font-size:15px">Děkujeme Vám za vyplnění svatební analýzy.</p>
        <p style="margin:0 0 28px;color:#444;line-height:1.7;font-size:15px">${personaSummary}</p>
        <p style="margin:0 0 24px;color:#444;line-height:1.7;font-size:15px">Na základě toho jsme pro Vás vybrali tato místa 👇</p>

        ${venueBlocks}

        ${crossSells}

        <div style="margin-top:32px;padding:24px;background:linear-gradient(135deg,#3E2723,#1F1310);color:#fff;border-radius:12px;text-align:center">
          <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:18px;color:#E8C98A">💰 Bonus pro Vás</p>
          <p style="margin:0;color:rgba(255,255,255,.85);font-size:14px;line-height:1.6">
            ${cashbackText}
          </p>
        </div>

        <p style="margin:32px 0 8px;color:#444;line-height:1.7;font-size:15px">Budeme se těšit na Vaši zprávu.</p>
        <p style="margin:0;color:#444;line-height:1.7;font-size:15px;font-style:italic">${signature} 🤍</p>

        <p style="margin:32px 0 0;padding-top:24px;border-top:1px solid #E8DDD0;color:#999;font-size:12px;text-align:center;line-height:1.6">
          Otázky? Napište na <a href="mailto:info@svatebnimista.cz" style="color:#C9A96E">info@svatebnimista.cz</a><br>
          nebo zavolejte na <a href="tel:+420123456789" style="color:#C9A96E">+420 123 456 789</a>
        </p>
      </div>
      <div style="background:#1F1310;padding:24px;text-align:center;color:rgba(255,255,255,.4);font-size:11px">© Svatební Místa.cz — Jediná služba v ČR pro výběr místa na míru</div>
    </div>
  </div>
  `
}

function companyEmail(a: WizardAnswers, matches: Match[]): string {
  return `
  <div style="font-family:Helvetica,Arial,sans-serif;background:#F9F6F0;padding:32px;color:#222">
    <h2 style="margin:0 0 16px">Nová poptávka z wizardu</h2>
    <table cellpadding="8" style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;border:1px solid #ddd">
      <tr><td><strong>Jméno:</strong></td><td>${a.name || "—"}</td></tr>
      <tr><td><strong>E-mail:</strong></td><td><a href="mailto:${a.email}">${a.email}</a></td></tr>
      <tr><td><strong>Telefon:</strong></td><td>${a.phone || "neuveden"}</td></tr>
      <tr><td><strong>Termín:</strong></td><td>${termLabel(a)}</td></tr>
      <tr><td><strong>Hostů:</strong></td><td>${a.guests}</td></tr>
      <tr><td><strong>Lokalita 90 min od:</strong></td><td>${a.nearestCity ?? "—"}</td></tr>
      <tr><td><strong>Kraje:</strong></td><td>${a.regions.join(", ") || "—"}</td></tr>
      <tr><td><strong>Typ místa:</strong></td><td>${a.archType}</td></tr>
      <tr><td><strong>Způsob svatby:</strong></td><td>${a.weddingMode}</td></tr>
      <tr><td><strong>Ubytování:</strong></td><td>${a.accommodation}</td></tr>
      <tr><td><strong>Catering:</strong></td><td>${a.catering}</td></tr>
      <tr><td><strong>Party:</strong></td><td>${a.party}</td></tr>
      <tr><td><strong>Pronájem:</strong></td><td>${a.rentalBudget ? "do " + fmt(a.rentalBudget) + " Kč" : "—"}</td></tr>
      <tr><td><strong>Rozpočet svatby:</strong></td><td>${a.weddingBudget ? "do " + fmt(a.weddingBudget) + " Kč" : "—"}</td></tr>
      <tr><td><strong>Speciální:</strong></td><td>${a.specialRequests || "—"}</td></tr>
      <tr><td><strong>Pomoc s:</strong></td><td>${a.serviceHelp.join(", ")}</td></tr>
      <tr><td><strong>Koordinátor:</strong></td><td>${a.needCoordinator}</td></tr>
      <tr><td><strong>DJ:</strong></td><td>${a.needDjModerator}</td></tr>
      <tr><td><strong>Foto:</strong></td><td>${a.needPhotographer}</td></tr>
      <tr><td><strong>Online konzultace:</strong></td><td>${a.wantOnlineConsultation ? "★ ANO" : "ne"}</td></tr>
      <tr><td><strong>Newsletter:</strong></td><td>${a.consentNewsletter ? "ANO" : "NE"}</td></tr>
    </table>
    <h3 style="margin:24px 0 12px">Doporučená místa</h3>
    <ol>
      ${matches.map((m) => `<li><strong>${m.venue.title}</strong> — shoda ${m.score} %<br><small>${m.reasons.join(" · ") || "—"}</small></li>`).join("")}
    </ol>
  </div>
  `
}
