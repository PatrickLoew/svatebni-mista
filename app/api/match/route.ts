import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { findBestMatches, type WizardAnswers, type Match } from "@/lib/matching"
import { SAMPLE_VENUES } from "@/lib/sample-venues"
import { validateEmail, validatePhone, validateName } from "@/lib/validation"
import { evaluateWithClaude } from "@/lib/claude-ai"
import { toCzechVocative } from "@/lib/czech-vocative"
import { isRegionWithin90Min, getAcceptableRegions } from "@/lib/geography"
import { mapDbToVenue } from "@/lib/venue-mapping"
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
        venues = rows.map(mapDbToVenue)
      }
    } catch (e) {
      console.error("DB venues error:", e)
    }
    if (venues.length === 0) {
      venues = SAMPLE_VENUES
    }

    // 🤖 CLAUDE AI vybírá 5 nejlepších míst z celé DB (jako specialista)
    let claudeResult: Awaited<ReturnType<typeof evaluateWithClaude>> = null
    let matches: Match[] = []
    try {
      claudeResult = await evaluateWithClaude(answers, venues)
    } catch (e) {
      console.error("Claude evaluation error:", e)
    }

    if (claudeResult && claudeResult.selectedMatches.length > 0) {
      // Claude vybral místa — sestavíme Match objekty
      const venueBySlug = new Map(venues.map((v) => [v.slug, v]))
      const claudeMatches: Match[] = claudeResult.selectedMatches
        .map((cm) => {
          const venue = venueBySlug.get(cm.slug)
          if (!venue) return null
          return {
            venue,
            score: 0, // Skóre už neřešíme — Claude rozhodl
            reasons: [],
            warnings: [],
            personalDescription: cm.personalDescription,
            bucket: cm.isAlternative ? "alternative" : "primary",
          } as Match
        })
        .filter((m): m is Match => m !== null)

      // ⚠️ POST-VALIDACE: kontrolujeme MUST-HAVE kritéria
      // Pokud místo poruší MUST-HAVE, přesune se do alternativ + varování
      const validateVenue = (v: Venue): { ok: boolean; reason?: string } => {
        // Kapacita: musí být alespoň 0.85× počet hostů
        if (v.capacity < answers.guests * 0.85) {
          return { ok: false, reason: `kapacita ${v.capacity} je nedostatečná pro ${answers.guests} hostů` }
        }
        // Rozpočet pronájmu: max +20 %
        if (answers.rentalBudget > 0 && v.priceFrom > answers.rentalBudget * 1.20) {
          return { ok: false, reason: `pronájem ${v.priceFrom.toLocaleString("cs-CZ")} Kč přesahuje rozpočet ${answers.rentalBudget.toLocaleString("cs-CZ")} Kč o víc než 20 %` }
        }
        // LOKALITA — primární filtr je `nearest_city` (každé místo je tagované,
        // do kterého velkého města je do 90 min). Sousední kraj NESEDÍ
        // automaticky — záleží na tom, zda má místo stejné nearest_city.
        if (answers.regions.length > 0) {
          // Klient zadal kraj — musí být v něm, ALE může být i v jiném kraji
          // pokud má místo nearest_city == klientovo město (např. místo v Ústeckém
          // kraji s nearest_city="Praha" = jih kraje, blízko Prahy)
          const inPreferredRegion = answers.regions.includes(v.region)
          const sameCity = !!answers.nearestCity
            && answers.nearestCity !== "jedno"
            && v.nearestCity === answers.nearestCity
          if (!inPreferredRegion && !sameCity) {
            return { ok: false, reason: `není v preferovaném kraji a nemá nearest_city = ${answers.nearestCity}` }
          }
        } else if (answers.nearestCity && answers.nearestCity !== "jedno") {
          // Klient zadal jen město — místo MUSÍ mít stejné nearest_city.
          // To je striktní pravidlo — místa v Libereckém s nearest_city=Liberec
          // se nezahrnou pro klienta z Prahy, i když je Liberecký "v dosahu".
          if (v.nearestCity !== answers.nearestCity) {
            return { ok: false, reason: `není do 90 min od ${answers.nearestCity} (nearest_city = ${v.nearestCity ?? "—"})` }
          }
        }
        // CATERING: klient chce vlastní catering → místo NESMÍ být "only_venue"
        if (answers.catering === "vlastni-vse") {
          // chce vlastní jídlo I pití bez poplatků → místo musí mít own_free
          if (v.cateringPolicy === "only_venue") {
            return { ok: false, reason: `místo zakazuje vlastní catering (pouze od místa), ale klient chce vlastní jídlo i pití` }
          }
          if (v.cateringPolicy === "own_drinks_free") {
            return { ok: false, reason: `místo povoluje pouze vlastní pití (jídlo musí být od místa), ale klient chce i vlastní jídlo` }
          }
        }
        if (answers.catering === "vlastni-piti") {
          // chce vlastní pití → místo musí mít own_free nebo own_drinks_free
          if (v.cateringPolicy === "only_venue") {
            return { ok: false, reason: `místo zakazuje vlastní pití, ale klient ho chce` }
          }
        }
        // PARTY: tvrdé kontroly podle preference klienta
        if (answers.party === "velka-bez-klidu") {
          // Chce velkou party bez nočního klidu → místo MUSÍ mít no_curfew (ideálně) nebo aspoň indoor_after_22
          if (v.nightPartyPolicy === "quiet_hours") {
            return { ok: false, reason: `místo má noční klid (party končí v 22:00), ale klient chce velkou party bez omezení` }
          }
          if (v.nightPartyPolicy === "indoor_after_22") {
            return { ok: false, reason: `místo vyžaduje po 22:00 přesun party dovnitř — klient ale chce party bez jakéhokoliv omezení` }
          }
        }
        if (answers.party === "pohoda") {
          // Pohoda: tolerantní — místo s quiet_hours je OK, no_curfew je OK
          // Bez tvrdé kontroly
        }
        if (answers.party === "do-22") {
          // Klient sám chce do 22 — vše OK, žádný konflikt
        }

        // UBYTOVÁNÍ: měkká kontrola (kapacita v DB často chybí — accommodation_capacity = 0 u většiny)
        // Pokud DB nemá ubytování vyplněné, NEVYLUČUJEME místo — bylo by to plošně.
        // Tvrdá kontrola až když máme data: aspoň 50 % VIP s capacity > 0.
        // Tuto kontrolu zatím vypínáme, dokud sync neopraví data.
        // if (answers.accommodation === "primo" && (v.accommodationCapacity ?? 0) === 0) {
        //   return { ok: false, reason: `místo nemá ubytování přímo na místě` }
        // }

        // ARCHITEKTONICKÝ TYP: měkká kontrola — typ je preference, ne tvrdé pravidlo.
        // Místo se přesune do alternativ (ne vyloučí), takže klient pořád dostane 5 nabídek.
        // Tvrdá kontrola jen pokud klient zaškrtnul výhradně 1 specifický typ (Zámek/Hotel apod.)
        const archTypes = (answers.archTypes ?? []).filter((t) => t !== "jedno")
        if (archTypes.length === 1 && ["zamek", "hrad", "hotelovy"].includes(archTypes[0])) {
          // Klient výhradně chce 1 specifický typ → musí sedět
          const typeMap: Record<string, string[]> = {
            priroda: ["Pláž / Příroda", "Zahrada"],
            unikat: ["Moderní prostor", "Historická budova"],
            hotelovy: ["Hotel"],
            mlyn: ["Venkovský statek"],
            industrial: ["Moderní prostor"],
            hrad: ["Zámek", "Historická budova"],
            zamek: ["Zámek"],
          }
          if (!typeMap[archTypes[0]]?.includes(v.type)) {
            return {
              ok: false,
              reason: `typ "${v.type}" neodpovídá preferenci klienta (chce výhradně ${archTypes[0]})`,
            }
          }
        }

        return { ok: true }
      }

      const validatedMatches: Match[] = []
      const rejectedFromPrimary: Match[] = []

      for (const m of claudeMatches) {
        const validation = validateVenue(m.venue)
        if (validation.ok) {
          validatedMatches.push(m)
        } else if (m.bucket !== "alternative") {
          // Primary místo porušilo MUST-HAVE → přesun do alternativ + varování v popisu
          console.warn(
            `[match] ⚠️ Claude vybral nevhodné místo "${m.venue.title}" jako primary: ${validation.reason}`,
          )
          validatedMatches.push({
            ...m,
            bucket: "alternative",
            personalDescription: `${m.personalDescription}${m.personalDescription ? " " : ""}(Pozor: ${validation.reason}.)`,
          })
          rejectedFromPrimary.push(m)
        } else {
          // Alternativa porušila MUST-HAVE → necháme, ale s varováním
          validatedMatches.push({
            ...m,
            personalDescription: `${m.personalDescription}${m.personalDescription ? " " : ""}(Pozor: ${validation.reason}.)`,
          })
        }
      }

      matches = validatedMatches

      console.log(
        `[match] Claude vybral ${matches.length} míst (primary: ${
          matches.filter((m) => m.bucket !== "alternative").length
        }, alternativy: ${matches.filter((m) => m.bucket === "alternative").length}, přesunuto kvůli validaci: ${rejectedFromPrimary.length})`,
      )

      // ===== FORCE VIP RULE =====
      // Pokud klient zadal lokalitu a v ní existuje VIP místo, MUSÍ být v doporučení.
      // Filtrujeme primárně podle `nearest_city` klienta (jaká VIP jsou skutečně
      // do 90 min od jeho centra), sekundárně podle kraje.
      const usedSlugsForVip = new Set(matches.map((m) => m.venue.slug))
      const allRelevantVips = venues
        .filter((v) => v.isFeatured && !usedSlugsForVip.has(v.slug))
        .filter((v) => {
          // Pokud klient zadal město → VIP musí mít stejné nearest_city
          if (answers.nearestCity && answers.nearestCity !== "jedno") {
            if (v.nearestCity === answers.nearestCity) return true
            // Nebo musí být v preferovaném kraji
            if (answers.regions.length > 0 && answers.regions.includes(v.region)) return true
            return false
          }
          // Pokud klient zadal jen kraj → VIP musí být v něm
          if (answers.regions.length > 0) {
            return answers.regions.includes(v.region)
          }
          // Klient nezadal nic — všechna VIP jsou kandidáti
          return true
        })

      // Validované VIP z preferovaných krajů (splňují MUST-HAVE)
      const validatedVips = allRelevantVips.filter((v) => validateVenue(v).ok)
      // Nevalidované VIP z preferovaných krajů (jako alternativa s varováním)
      const partialVips = allRelevantVips.filter((v) => !validateVenue(v).ok)

      const locationDesc = answers.nearestCity && answers.nearestCity !== "jedno"
        ? `90 min od ${answers.nearestCity}` + (answers.regions.length > 0 ? ` + kraj ${answers.regions.join("/")}` : "")
        : answers.regions.length > 0 ? `kraj ${answers.regions.join("/")}` : "celá ČR"
      console.log(
        `[match] FORCE VIP RULE — k dispozici ${allRelevantVips.length} VIP pro ${locationDesc}: validovaných ${validatedVips.length}, částečných ${partialVips.length}`,
      )

      // Pokud Claude některé VIP přehlédl, vložíme je natvrdo
      const primaryCount = matches.filter((m) => m.bucket !== "alternative").length
      if (primaryCount < 3 && validatedVips.length > 0) {
        const need = Math.min(validatedVips.length, 3 - primaryCount)
        for (let i = 0; i < need; i++) {
          const v = validatedVips[i]
          matches.unshift({
            venue: v,
            score: 0,
            reasons: [],
            warnings: [],
            personalDescription: "Naše top VIP doporučení ze selekce ve Vašem kraji — splňuje všechna Vaše kritéria.",
            bucket: "primary",
          })
        }
        console.log(`[match] Force-přidáno ${need} validovaných VIP do primary`)
      }

      // Doplnění alternativ: zbylé VIP (i částečné) z dosažitelných krajů
      if (matches.length < 5) {
        const used = new Set(matches.map((m) => m.venue.slug))
        const candidates = [
          ...validatedVips.filter((v) => !used.has(v.slug)),
          ...partialVips.filter((v) => !used.has(v.slug)),
        ].slice(0, 5 - matches.length)

        for (const v of candidates) {
          const validation = validateVenue(v)
          matches.push({
            venue: v,
            score: 0,
            reasons: [],
            warnings: [],
            personalDescription: validation.ok
              ? "Doporučujeme jako alternativu z naší VIP sekce ve Vašem kraji."
              : `Doporučujeme jako alternativu z naší VIP sekce. Pozor: ${validation.reason}.`,
            bucket: "alternative",
          })
        }
        console.log(`[match] Doplněno ${candidates.length} VIP alternativ`)
      }

      // Poslední doplnění: nejlepší z algoritmu (fallback)
      if (matches.length < 5) {
        const used = new Set(matches.map((m) => m.venue.slug))
        const algoMatches = findBestMatches(venues, answers, 10)
          .filter((m) => !used.has(m.venue.slug))
          .slice(0, 5 - matches.length)
        for (const m of algoMatches) {
          matches.push({ ...m, bucket: "alternative" })
        }
      }

      // ===== PRAVIDLO REPREZENTACE KRAJŮ =====
      // Pokud klient zadal víc krajů, KAŽDÝ kraj musí mít aspoň 1 místo v doporučení.
      // Pokud nějaký kraj chybí, nahradíme nejhorší alternativu místem z chybějícího kraje.
      if (answers.regions.length >= 2) {
        const representedRegions = new Set(matches.map((m) => m.venue.region))
        const missingRegions = answers.regions.filter((r) => !representedRegions.has(r))

        for (const missing of missingRegions) {
          // Najdi nejlepší místo z chybějícího kraje (priorita: VIP → splňuje MUST-HAVE → ostatní)
          const used = new Set(matches.map((m) => m.venue.slug))
          const candidates = venues
            .filter((v) => v.region === missing && !used.has(v.slug))
            .sort((a, b) => {
              // VIP první
              if (a.isFeatured && !b.isFeatured) return -1
              if (!a.isFeatured && b.isFeatured) return 1
              // Validní MUST-HAVE preferujeme
              const aOk = validateVenue(a).ok
              const bOk = validateVenue(b).ok
              if (aOk && !bOk) return -1
              if (!aOk && bOk) return 1
              return 0
            })

          if (candidates.length === 0) continue

          const chosen = candidates[0]
          const validation = validateVenue(chosen)

          // Nahraď nejhorší alternativu (poslední) nebo přidej, pokud máme < 5
          const newMatch: Match = {
            venue: chosen,
            score: 0,
            reasons: [],
            warnings: [],
            personalDescription: chosen.isFeatured
              ? `Doporučujeme z naší VIP sekce v kraji ${missing}.${validation.ok ? "" : ` Pozor: ${validation.reason}.`}`
              : `Z kraje ${missing} doporučujeme toto místo.${validation.ok ? "" : ` Pozor: ${validation.reason}.`}`,
            bucket: "alternative",
          }

          // Nahraď nejhorší alternativu (poslední non-primary), nebo přidej pokud < 5
          const lastAltIdx = matches.map((m) => m.bucket).lastIndexOf("alternative")
          if (matches.length >= 5 && lastAltIdx >= 0) {
            matches[lastAltIdx] = newMatch
          } else if (matches.length < 5) {
            matches.push(newMatch)
          }
          console.log(`[match] Doplněno místo z chybějícího kraje ${missing}: ${chosen.title}`)
        }
      }
    } else {
      // FALLBACK — Claude selhal, použij algoritmus
      console.log("[match] Claude selhal, používám algoritmus jako fallback")
      try {
        matches = findBestMatches(venues, answers, 5)
      } catch (e) {
        console.error("Match algorithm error:", e)
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
          subject: `Váš osobní návrh svatebních míst — ${toCzechVocative(answers.name)}`,
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
  const matchLines = matches.map((m, i) => {
    const bucketLabel = m.bucket === "alternative" ? "[ALT]" : "[TOP]"
    const vip = m.venue.isFeatured ? " [VIP]" : ""
    return `${i + 1}. ${bucketLabel}${vip} ${m.venue.title} (${m.venue.region}, ${m.venue.capacity} hostů, od ${m.venue.priceFrom.toLocaleString("cs-CZ")} Kč)
   → ${m.personalDescription ?? "—"}`
  }).join("\n")

  return [
    `Termín: ${termLabel(a)}`,
    `Hostů: ${a.guests}`,
    `Lokalita do 90 min od: ${a.nearestCity ?? "neuvedeno"}`,
    `Kraje: ${a.regions.join(", ") || "—"}`,
    `Typ místa: ${(a.archTypes ?? []).join(", ") || "neuvedeno"}`,
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
    `=== AI DOPORUČENÍ (${matches.length} míst) ===`,
    matchLines,
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
  const archTypes = (a.archTypes ?? []).filter((t) => t !== "jedno" && arch[t])
  if (archTypes.length > 0) {
    parts.push(archTypes.map((t) => arch[t]).join(" nebo "))
  }

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
        <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:18px;color:#3E2723">Fotograf</p>
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
        <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:18px;color:#3E2723">DJ a moderátor</p>
        <p style="margin:0;color:#444;font-size:14px;line-height:1.6">Velmi rádi doporučíme například <strong>Yes.Musicz</strong> nebo <strong>DJ Prague</strong> — oba opravdu top za rozumné ceny.</p>
      </div>`)
  }
  if (a.needCoordinator === "ano") {
    blocks.push(`
      <div style="margin-top:24px;padding:24px;background:#F9F2E6;border-radius:12px">
        <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:18px;color:#3E2723">Koordinátorka</p>
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
  const firstName = toCzechVocative(a.name) || "milí novomanželé"
  // Preferuj personalizovaný persona summary od Claude, fallback na algoritmus
  const personaSummary = claude?.personaSummary || buildPersonaSummary(a)
  const cashbackText = claude?.cashbackText || "Pokud si nakonec vyberete některé z míst, která jsme Vám doporučili, a dáte nám vědět, můžeme Vám u vybraných míst zajistit <strong>cashback ve výši 1 000 až 10 000 Kč</strong>."
  const signature = claude?.signature || "Mějte se krásně"
  const crossSells = buildCrossSells(a)

  const renderVenue = (m: Match, isLast: boolean) => {
    const isVip = m.venue.isFeatured
    const personalDesc = m.personalDescription ?? ""
    return `
    <div style="margin-bottom:24px;padding-bottom:24px;${!isLast ? "border-bottom:1px solid #E8DDD0;" : ""}">
      <h3 style="margin:0 0 6px;font-family:Georgia,serif;font-weight:400;font-size:20px;color:#3E2723">
        ${m.venue.title}
        ${isVip ? `<span style="background:linear-gradient(90deg,#A88240,#E8C98A);color:#fff;font-size:10px;letter-spacing:1px;padding:3px 8px;border-radius:10px;margin-left:6px;font-family:Helvetica;">★ DOPORUČUJEME</span>` : ""}
      </h3>
      <p style="margin:0 0 8px;color:#888;font-size:12px">${m.venue.location} · do ${m.venue.capacity} hostů · od ${fmt(m.venue.priceFrom)} Kč</p>
      <p style="margin:0;color:#444;line-height:1.6;font-size:14px">${personalDesc}</p>
    </div>`
  }

  const primaryMatches = matches.filter((m) => m.bucket !== "alternative")
  const alternativeMatches = matches.filter((m) => m.bucket === "alternative")

  const primaryBlocks = primaryMatches
    .map((m, i) => renderVenue(m, i === primaryMatches.length - 1))
    .join("")

  const alternativeBlocks = alternativeMatches.length > 0
    ? `
    <div style="margin-top:32px;padding-top:24px;border-top:2px dashed #E8DDD0">
      <p style="margin:0 0 4px;color:#A88240;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600">Doporučujeme jako alternativu</p>
      <p style="margin:0 0 20px;color:#666;font-size:13px;line-height:1.6;font-style:italic">
        Tato místa nesplňují všechna Vaše kritéria na 100 %, ale stojí za zvážení — jsou z naší ověřené VIP sekce.
      </p>
      ${alternativeMatches.map((m, i) => renderVenue(m, i === alternativeMatches.length - 1)).join("")}
    </div>`
    : ""

  const venueBlocks = primaryBlocks + alternativeBlocks

  return `
  <div style="font-family:Helvetica,Arial,sans-serif;background:#F9F6F0;padding:40px 20px">
    <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden">
      <div style="background:#3E2723;padding:50px 40px;text-align:center;color:#fff">
        <p style="margin:0 0 12px;color:#E8C98A;font-size:11px;letter-spacing:3px;text-transform:uppercase">Váš osobní návrh</p>
        <h1 style="margin:0;font-family:Georgia,serif;font-weight:300;font-size:34px;line-height:1.2">Dobrý den, ${firstName}</h1>
      </div>
      <div style="padding:40px">
        <p style="margin:0 0 16px;color:#444;line-height:1.7;font-size:15px">Děkujeme Vám za vyplnění svatební analýzy.</p>
        <p style="margin:0 0 28px;color:#444;line-height:1.7;font-size:15px">${personaSummary}</p>
        <p style="margin:0 0 24px;color:#444;line-height:1.7;font-size:15px">Na základě toho jsme pro Vás vybrali tato místa 👇</p>

        ${venueBlocks}

        ${crossSells}

        <div style="margin-top:32px;padding:24px;background:linear-gradient(135deg,#3E2723,#1F1310);color:#fff;border-radius:12px;text-align:center">
          <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:18px;color:#E8C98A">Bonus pro Vás</p>
          <p style="margin:0;color:rgba(255,255,255,.85);font-size:14px;line-height:1.6">
            ${cashbackText}
          </p>
        </div>

        <p style="margin:32px 0 8px;color:#444;line-height:1.7;font-size:15px">Budeme se těšit na Vaši zprávu.</p>
        <p style="margin:0;color:#444;line-height:1.7;font-size:15px;font-style:italic">${signature}</p>

        <p style="margin:32px 0 0;padding-top:24px;border-top:1px solid #E8DDD0;color:#999;font-size:12px;text-align:center;line-height:1.6">
          Otázky? Napište na <a href="mailto:svatebnimista@svatebnimista.cz" style="color:#C9A96E">svatebnimista@svatebnimista.cz</a><br>
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
      <tr><td><strong>Typ místa:</strong></td><td>${(a.archTypes ?? []).join(", ") || "—"}</td></tr>
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
