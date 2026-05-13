import { supabaseAdmin } from "./supabase"

export interface SiteSettings {
  // Kontaktní údaje
  phone: string
  whatsapp: string
  email: string
  hours: string
  address: string

  // HERO
  heroEyebrow: string
  heroTitleLine1: string
  heroTitleLine2: string
  heroTitleLine3: string
  heroSubtitle: string
  heroPrimaryCta: string
  heroSecondaryCta: string

  // Statistiky
  statWeddings: string
  statRating: string
  statVenues: string
  statYears: string

  // PROCESS
  processEyebrow: string
  processTitle: string
  processSubtitle: string
  process1Title: string
  process1Desc: string
  process2Title: string
  process2Desc: string
  process3Title: string
  process3Desc: string

  // KONZULTACE CTA
  ctaEyebrow: string
  ctaTitle: string
  ctaSubtitle: string
  card1Title: string
  card1Description: string
  card2Title: string
  card2Description: string

  // CLOSING
  closingQuote: string
  closingSignature: string

  // SOCIÁLNÍ SÍTĚ
  instagramUrl: string
  facebookUrl: string

  // FAQ (6 items)
  faq1Q: string; faq1A: string
  faq2Q: string; faq2A: string
  faq3Q: string; faq3A: string
  faq4Q: string; faq4A: string
  faq5Q: string; faq5A: string
  faq6Q: string; faq6A: string

  // FOOTER
  footerDescription: string
}

export const DEFAULT_SETTINGS: SiteSettings = {
  phone: "+420 123 456 789",
  whatsapp: "+420123456789",
  email: "svatebnimista@svatebnimista.cz",
  hours: "Po–Pá, 9:00 – 18:00",
  address: "Praha 1, Česká republika",

  heroEyebrow: "Jediná služba v ČR",
  heroTitleLine1: "Svatební místo",
  heroTitleLine2: "přesně na míru",
  heroTitleLine3: "",
  heroSubtitle: "Jediná služba v České republice, která vám podle vašich kritérií vyhodnotí to nejlepší svatební místo. Žádné koordinace, žádné plánování — jen ten správný prostor.",
  heroPrimaryCta: "Spustit analýzu",
  heroSecondaryCta: "Prohlédnout celý katalog",

  statWeddings: "500+",
  statRating: "4,9 ★",
  statVenues: "200+",
  statYears: "7",

  processEyebrow: "Jak fungujeme",
  processTitle: "Tři kroky k vašemu místu na míru",
  processSubtitle: "Jediná služba v ČR, která vám podle vašich kritérií vyhodnotí to nejlepší svatební místo. Žádné plánování, žádná koordinace — jen ten správný prostor.",
  process1Title: "Vyplníte krátkou analýzu",
  process1Desc: "Šest jednoduchých otázek o vaší vizi, počtu hostů, rozpočtu a preferencích. Zabere vám to 5 minut a je to zcela zdarma.",
  process2Title: "Najdeme místo na míru",
  process2Desc: "Naši specialisté projdou stovky míst v naší databázi a vyberou tři, která přesně odpovídají vašim představám.",
  process3Title: "Pošleme vám návrh",
  process3Desc: "Do 24 hodin obdržíte e-mailem detailní návrh tří míst včetně rozpočtových rozpadů a přímých kontaktů.",

  ctaEyebrow: "Začněte hledat své místo",
  ctaTitle: "Najděte své svatební místo na míru",
  ctaSubtitle: "Jediná služba v ČR, která vám podle vašich kritérií vyhodnotí nejlepší svatební místo. Vyberte si cestu — obě jsou zdarma a bez závazku.",
  card1Title: "Svatební místo na míru",
  card1Description: "6 otázek, 5 minut. Naše analýza projde stovky míst a do 24 hodin dostanete osobní výběr 5 míst přímo na e-mail.",
  card2Title: "Individuální konzultace",
  card2Description: "30 minut s naším specialistou na svatební místa. Online, telefonicky nebo osobně. Hlubší analýza, konkrétní doporučení.",

  closingQuote: "Ať už zvolíte cokoliv — vždy se s vámi rádi spojíme. Těšíme se, že budeme moci být součástí vašeho příběhu.",
  closingSignature: "Tým Svatební Místa",

  instagramUrl: "",
  facebookUrl: "",

  faq1Q: "Co znamená Svatební místo na míru?",
  faq1A: "Sami provozujeme svatební místa, takže přesně víme, jak fungují, na co se ptát a co je v praxi důležité. Místo abyste hodiny prohledávali katalogy, vyplníte krátkou analýzu a my vám doporučíme pět míst, která sednou přesně k vaší vizi a rozpočtu.",
  faq2Q: "Plánujete nebo koordinujete svatby?",
  faq2A: "Ne — to není naše služba. My pomáháme najít to správné svatební místo. Samotné plánování (catering, dekorace, koordinace v den D) si pak buď řeší majitel daného místa, nebo si můžete najmout svatebního koordinátora.",
  faq3Q: "Jak brzy bychom měli začít hledat místo?",
  faq3A: "Pro prémiová místa v hlavní sezóně (květen–září) doporučujeme začít hledat 12–18 měsíců předem. Mimo sezónu nebo ve všedních dnech si vystačíte s 6–9 měsíci. Naše analýza vám okamžitě ukáže, která místa mají volné termíny.",
  faq4Q: "Kolik analýza stojí?",
  faq4A: "Analýza i následný návrh míst je pro vás zcela zdarma. Naši partneři (svatební místa) nám platí provizi pouze v případě, že si u nich rezervujete termín — vy nic neplatíte. Žádné skryté poplatky.",
  faq5Q: "Pracujete po celé České republice?",
  faq5A: "Ano. Naše databáze obsahuje místa ve všech 14 krajích, plus partnerská místa na Slovensku. Pro každý kraj máme prověřené partnery, se kterými dlouhodobě spolupracujeme.",
  faq6Q: "Jaký je první krok?",
  faq6A: "Vyplňte naši krátkou analýzu — 6 otázek, 5 minut. Do 24 hodin vám e-mailem pošleme pět míst, která se nejvíc hodí k vaší vizi. Dále si můžete domluvit individuální konzultaci pro hlubší probrání.",

  footerDescription: "Prémiový svatební planning, catering a vyhledávání míst. Od první kávy až po poslední přípitek — postaráme se o všechno, co musí klapnout, abyste si svůj den jen užívali.",
}

const dbToObject = (row: Record<string, unknown>): SiteSettings => {
  const get = <K extends keyof SiteSettings>(dbKey: string, defaultKey: K): SiteSettings[K] => {
    const v = row[dbKey]
    if (typeof v === "string" && v.length > 0) return v as SiteSettings[K]
    return DEFAULT_SETTINGS[defaultKey]
  }
  return {
    phone: get("phone", "phone"),
    whatsapp: get("whatsapp", "whatsapp"),
    email: get("email", "email"),
    hours: get("hours", "hours"),
    address: get("address", "address"),
    heroEyebrow: get("hero_eyebrow", "heroEyebrow"),
    heroTitleLine1: get("hero_title_line1", "heroTitleLine1"),
    heroTitleLine2: get("hero_title_line2", "heroTitleLine2"),
    heroTitleLine3: get("hero_title_line3", "heroTitleLine3"),
    heroSubtitle: get("hero_subtitle", "heroSubtitle"),
    heroPrimaryCta: get("hero_primary_cta", "heroPrimaryCta"),
    heroSecondaryCta: get("hero_secondary_cta", "heroSecondaryCta"),
    statWeddings: get("stat_weddings", "statWeddings"),
    statRating: get("stat_rating", "statRating"),
    statVenues: get("stat_venues", "statVenues"),
    statYears: get("stat_years", "statYears"),
    processEyebrow: get("process_eyebrow", "processEyebrow"),
    processTitle: get("process_title", "processTitle"),
    processSubtitle: get("process_subtitle", "processSubtitle"),
    process1Title: get("process1_title", "process1Title"),
    process1Desc: get("process1_desc", "process1Desc"),
    process2Title: get("process2_title", "process2Title"),
    process2Desc: get("process2_desc", "process2Desc"),
    process3Title: get("process3_title", "process3Title"),
    process3Desc: get("process3_desc", "process3Desc"),
    ctaEyebrow: get("cta_eyebrow", "ctaEyebrow"),
    ctaTitle: get("cta_title", "ctaTitle"),
    ctaSubtitle: get("cta_subtitle", "ctaSubtitle"),
    card1Title: get("card1_title", "card1Title"),
    card1Description: get("card1_description", "card1Description"),
    card2Title: get("card2_title", "card2Title"),
    card2Description: get("card2_description", "card2Description"),
    closingQuote: get("closing_quote", "closingQuote"),
    closingSignature: get("closing_signature", "closingSignature"),
    instagramUrl: get("instagram_url", "instagramUrl"),
    facebookUrl: get("facebook_url", "facebookUrl"),
    faq1Q: get("faq1_q", "faq1Q"), faq1A: get("faq1_a", "faq1A"),
    faq2Q: get("faq2_q", "faq2Q"), faq2A: get("faq2_a", "faq2A"),
    faq3Q: get("faq3_q", "faq3Q"), faq3A: get("faq3_a", "faq3A"),
    faq4Q: get("faq4_q", "faq4Q"), faq4A: get("faq4_a", "faq4A"),
    faq5Q: get("faq5_q", "faq5Q"), faq5A: get("faq5_a", "faq5A"),
    faq6Q: get("faq6_q", "faq6Q"), faq6A: get("faq6_a", "faq6A"),
    footerDescription: get("footer_description", "footerDescription"),
  }
}

const objectToDb = (s: Partial<SiteSettings>): Record<string, unknown> => ({
  phone: s.phone, whatsapp: s.whatsapp, email: s.email, hours: s.hours, address: s.address,
  hero_eyebrow: s.heroEyebrow,
  hero_title_line1: s.heroTitleLine1, hero_title_line2: s.heroTitleLine2, hero_title_line3: s.heroTitleLine3,
  hero_subtitle: s.heroSubtitle,
  hero_primary_cta: s.heroPrimaryCta, hero_secondary_cta: s.heroSecondaryCta,
  stat_weddings: s.statWeddings, stat_rating: s.statRating,
  stat_venues: s.statVenues, stat_years: s.statYears,
  process_eyebrow: s.processEyebrow, process_title: s.processTitle, process_subtitle: s.processSubtitle,
  process1_title: s.process1Title, process1_desc: s.process1Desc,
  process2_title: s.process2Title, process2_desc: s.process2Desc,
  process3_title: s.process3Title, process3_desc: s.process3Desc,
  cta_eyebrow: s.ctaEyebrow, cta_title: s.ctaTitle, cta_subtitle: s.ctaSubtitle,
  card1_title: s.card1Title, card1_description: s.card1Description,
  card2_title: s.card2Title, card2_description: s.card2Description,
  closing_quote: s.closingQuote, closing_signature: s.closingSignature,
  instagram_url: s.instagramUrl, facebook_url: s.facebookUrl,
  faq1_q: s.faq1Q, faq1_a: s.faq1A,
  faq2_q: s.faq2Q, faq2_a: s.faq2A,
  faq3_q: s.faq3Q, faq3_a: s.faq3A,
  faq4_q: s.faq4Q, faq4_a: s.faq4A,
  faq5_q: s.faq5Q, faq5_a: s.faq5A,
  faq6_q: s.faq6Q, faq6_a: s.faq6A,
  footer_description: s.footerDescription,
  updated_at: new Date().toISOString(),
})

export async function getSettings(): Promise<SiteSettings> {
  try {
    const { data } = await supabaseAdmin.from("site_settings").select("*").eq("id", 1).single()
    if (!data) return DEFAULT_SETTINGS
    return dbToObject(data)
  } catch {
    return DEFAULT_SETTINGS
  }
}

export async function updateSettings(s: Partial<SiteSettings>): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from("site_settings")
      .update(objectToDb(s))
      .eq("id", 1)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}
