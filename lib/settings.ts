import { supabaseAdmin } from "./supabase"

export interface SiteSettings {
  phone: string
  whatsapp: string
  email: string
  hours: string
  address: string
  heroEyebrow: string
  heroTitleLine1: string
  heroTitleLine2: string
  heroTitleLine3: string
  heroSubtitle: string
  statWeddings: string
  statRating: string
  statVenues: string
  statYears: string
  closingQuote: string
  closingSignature: string
  instagramUrl: string
  facebookUrl: string
}

export const DEFAULT_SETTINGS: SiteSettings = {
  phone: "+420 123 456 789",
  whatsapp: "+420123456789",
  email: "info@svatebnimista.cz",
  hours: "Po–Pá, 9:00 – 18:00",
  address: "Praha 1, Česká republika",
  heroEyebrow: "Wedding planning · Est. 2018",
  heroTitleLine1: "Den, který si",
  heroTitleLine2: "budete pamatovat",
  heroTitleLine3: "celý život.",
  heroSubtitle: "Pomáháme párům najít dokonalé místo, sestavit catering snů a postarat se o každý detail vaší svatby od A do Z.",
  statWeddings: "500+",
  statRating: "4,9 ★",
  statVenues: "200+",
  statYears: "7",
  closingQuote: "Ať už zvolíte cokoliv — vždy se s vámi rádi spojíme. Těšíme se, že budeme moci být součástí vašeho příběhu.",
  closingSignature: "Tým Svatební Místa",
  instagramUrl: "",
  facebookUrl: "",
}

const dbToObject = (row: Record<string, unknown>): SiteSettings => ({
  phone:            (row.phone as string) ?? DEFAULT_SETTINGS.phone,
  whatsapp:         (row.whatsapp as string) ?? DEFAULT_SETTINGS.whatsapp,
  email:            (row.email as string) ?? DEFAULT_SETTINGS.email,
  hours:            (row.hours as string) ?? DEFAULT_SETTINGS.hours,
  address:          (row.address as string) ?? DEFAULT_SETTINGS.address,
  heroEyebrow:      (row.hero_eyebrow as string) ?? DEFAULT_SETTINGS.heroEyebrow,
  heroTitleLine1:   (row.hero_title_line1 as string) ?? DEFAULT_SETTINGS.heroTitleLine1,
  heroTitleLine2:   (row.hero_title_line2 as string) ?? DEFAULT_SETTINGS.heroTitleLine2,
  heroTitleLine3:   (row.hero_title_line3 as string) ?? DEFAULT_SETTINGS.heroTitleLine3,
  heroSubtitle:     (row.hero_subtitle as string) ?? DEFAULT_SETTINGS.heroSubtitle,
  statWeddings:     (row.stat_weddings as string) ?? DEFAULT_SETTINGS.statWeddings,
  statRating:       (row.stat_rating as string) ?? DEFAULT_SETTINGS.statRating,
  statVenues:       (row.stat_venues as string) ?? DEFAULT_SETTINGS.statVenues,
  statYears:        (row.stat_years as string) ?? DEFAULT_SETTINGS.statYears,
  closingQuote:     (row.closing_quote as string) ?? DEFAULT_SETTINGS.closingQuote,
  closingSignature: (row.closing_signature as string) ?? DEFAULT_SETTINGS.closingSignature,
  instagramUrl:     (row.instagram_url as string) ?? DEFAULT_SETTINGS.instagramUrl,
  facebookUrl:      (row.facebook_url as string) ?? DEFAULT_SETTINGS.facebookUrl,
})

const objectToDb = (s: Partial<SiteSettings>): Record<string, unknown> => ({
  phone: s.phone, whatsapp: s.whatsapp, email: s.email, hours: s.hours, address: s.address,
  hero_eyebrow: s.heroEyebrow,
  hero_title_line1: s.heroTitleLine1,
  hero_title_line2: s.heroTitleLine2,
  hero_title_line3: s.heroTitleLine3,
  hero_subtitle: s.heroSubtitle,
  stat_weddings: s.statWeddings, stat_rating: s.statRating,
  stat_venues: s.statVenues, stat_years: s.statYears,
  closing_quote: s.closingQuote, closing_signature: s.closingSignature,
  instagram_url: s.instagramUrl, facebook_url: s.facebookUrl,
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
