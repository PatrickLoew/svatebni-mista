"use client"

import { useEffect, useState } from "react"
import { Loader2, Save, CheckCircle, ChevronDown } from "lucide-react"
import type { SiteSettings } from "@/lib/settings"
import { DEFAULT_SETTINGS } from "@/lib/settings"

export default function AdminSettingsPage() {
  const [s, setS] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setS({ ...DEFAULT_SETTINGS, ...data }))
      .finally(() => setLoading(false))
  }, [])

  const set = <K extends keyof SiteSettings>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setS((p) => ({ ...p, [k]: e.target.value }))

  async function save() {
    setSaving(true); setSaved(false)
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      })
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    } finally { setSaving(false) }
  }

  if (loading) {
    return <div className="max-w-3xl space-y-4"><div className="h-32 skeleton rounded-2xl" /><div className="h-48 skeleton rounded-2xl" /></div>
  }

  return (
    <div className="max-w-3xl pb-24">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-light mb-1">Nastavení webu</h1>
        <p className="text-charcoal/60 text-sm">Upravte jakýkoli text na webu. Změny se ihned uloží do databáze.</p>
      </div>

      <div className="space-y-3">
        {/* Kontakt */}
        <Section title="Kontaktní údaje" defaultOpen={true}>
          <Row>
            <Field label="Telefon" value={s.phone} onChange={set("phone")} placeholder="+420 722 123 456" />
            <Field label="WhatsApp (bez mezer)" value={s.whatsapp} onChange={set("whatsapp")} placeholder="+420722123456" />
          </Row>
          <Row>
            <Field label="E-mail" value={s.email} onChange={set("email")} placeholder="svatebnimista@svatebnimista.cz" />
            <Field label="Otevírací doba" value={s.hours} onChange={set("hours")} />
          </Row>
          <Field label="Adresa" value={s.address} onChange={set("address")} />
        </Section>

        {/* HERO */}
        <Section title="Hero — úvodní obrazovka">
          <Field label="Badge (zlatý popisek nahoře)" value={s.heroEyebrow} onChange={set("heroEyebrow")} />
          <Row>
            <Field label="Nadpis — řádek 1" value={s.heroTitleLine1} onChange={set("heroTitleLine1")} />
            <Field label="Nadpis — řádek 2 (zlatý italic)" value={s.heroTitleLine2} onChange={set("heroTitleLine2")} />
          </Row>
          <Field label="Nadpis — řádek 3 (volitelné)" value={s.heroTitleLine3} onChange={set("heroTitleLine3")} />
          <Textarea label="Podnadpis (delší popis pod nadpisem)" rows={3} value={s.heroSubtitle} onChange={set("heroSubtitle")} />
          <Row>
            <Field label="Hlavní tlačítko (text)" value={s.heroPrimaryCta} onChange={set("heroPrimaryCta")} />
            <Field label="Vedlejší tlačítko (text)" value={s.heroSecondaryCta} onChange={set("heroSecondaryCta")} />
          </Row>
        </Section>

        {/* Statistiky */}
        <Section title="Statistiky (čísla v glass kartách)">
          <Row>
            <Field label="Svateb organizovaných" value={s.statWeddings} onChange={set("statWeddings")} />
            <Field label="Hodnocení" value={s.statRating} onChange={set("statRating")} />
          </Row>
          <Row>
            <Field label="Počet míst" value={s.statVenues} onChange={set("statVenues")} />
            <Field label="Let zkušeností" value={s.statYears} onChange={set("statYears")} />
          </Row>
        </Section>

        {/* PROCESS */}
        <Section title={`Sekce „Jak to funguje"`}>
          <Field label="Badge" value={s.processEyebrow} onChange={set("processEyebrow")} />
          <Field label="Hlavní nadpis" value={s.processTitle} onChange={set("processTitle")} />
          <Textarea label="Popis pod nadpisem" rows={2} value={s.processSubtitle} onChange={set("processSubtitle")} />

          <div className="bg-[#F9F2E6]/40 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-[#A88240] tracking-wider uppercase">Krok 1</p>
            <Field label="Nadpis" value={s.process1Title} onChange={set("process1Title")} />
            <Textarea label="Popis" rows={2} value={s.process1Desc} onChange={set("process1Desc")} />
          </div>
          <div className="bg-[#F9F2E6]/40 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-[#A88240] tracking-wider uppercase">Krok 2</p>
            <Field label="Nadpis" value={s.process2Title} onChange={set("process2Title")} />
            <Textarea label="Popis" rows={2} value={s.process2Desc} onChange={set("process2Desc")} />
          </div>
          <div className="bg-[#F9F2E6]/40 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-[#A88240] tracking-wider uppercase">Krok 3</p>
            <Field label="Nadpis" value={s.process3Title} onChange={set("process3Title")} />
            <Textarea label="Popis" rows={2} value={s.process3Desc} onChange={set("process3Desc")} />
          </div>
        </Section>

        {/* CTA Sekce */}
        <Section title={`Sekce „Pojďme začít psát váš příběh"`}>
          <Field label="Badge" value={s.ctaEyebrow} onChange={set("ctaEyebrow")} />
          <Field label="Hlavní nadpis" value={s.ctaTitle} onChange={set("ctaTitle")} />
          <Textarea label="Popis pod nadpisem" rows={2} value={s.ctaSubtitle} onChange={set("ctaSubtitle")} />

          <div className="bg-[#F9F2E6]/40 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-[#A88240] tracking-wider uppercase">Karta 1 — Online dotazník</p>
            <Field label="Nadpis karty" value={s.card1Title} onChange={set("card1Title")} />
            <Textarea label="Popis karty" rows={2} value={s.card1Description} onChange={set("card1Description")} />
          </div>
          <div className="bg-[#F9F2E6]/40 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-[#A88240] tracking-wider uppercase">Karta 2 — Konzultace</p>
            <Field label="Nadpis karty" value={s.card2Title} onChange={set("card2Title")} />
            <Textarea label="Popis karty" rows={2} value={s.card2Description} onChange={set("card2Description")} />
          </div>
        </Section>

        {/* FAQ */}
        <Section title="FAQ — Časté otázky">
          {[1, 2, 3, 4, 5, 6].map((i) => {
            const qKey = `faq${i}Q` as keyof SiteSettings
            const aKey = `faq${i}A` as keyof SiteSettings
            return (
              <div key={i} className="bg-[#F9F2E6]/40 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-[#A88240] tracking-wider uppercase">Otázka {i}</p>
                <Field label="Otázka" value={s[qKey] as string} onChange={set(qKey)} />
                <Textarea label="Odpověď" rows={3} value={s[aKey] as string} onChange={set(aKey)} />
              </div>
            )
          })}
        </Section>

        {/* Closing */}
        <Section title="Závěrečný citát">
          <Textarea label="Citát" rows={3} value={s.closingQuote} onChange={set("closingQuote")} />
          <Field label="Podpis" value={s.closingSignature} onChange={set("closingSignature")} />
        </Section>

        {/* Footer */}
        <Section title="Patička webu">
          <Textarea label="Popis firmy v patičce" rows={3} value={s.footerDescription} onChange={set("footerDescription")} />
        </Section>

        {/* Sociální sítě */}
        <Section title="Sociální sítě">
          <Row>
            <Field label="Instagram URL" value={s.instagramUrl} onChange={set("instagramUrl")} placeholder="https://instagram.com/svatebnimista" />
            <Field label="Facebook URL" value={s.facebookUrl} onChange={set("facebookUrl")} placeholder="https://facebook.com/svatebnimista" />
          </Row>
        </Section>
      </div>

      {/* Sticky save */}
      <div className="sticky bottom-4 mt-8 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#E8DDD0] shadow-lg flex items-center justify-between gap-4 z-10">
        <div className="text-sm">
          {saved ? (
            <span className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle size={16} /> Uloženo! Změny jsou na webu.
            </span>
          ) : (
            <span className="text-charcoal/60">Po kliknutí se vše uloží do databáze.</span>
          )}
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="bg-[#3E2723] text-white font-semibold px-7 py-3 rounded-full hover:bg-[#1F1310] transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Ukládám…" : "Uložit změny"}
        </button>
      </div>
    </div>
  )
}

/* ─────────── KOMPONENTY ─────────── */

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white border border-[#E8DDD0] rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full px-6 py-5 flex items-center justify-between hover:bg-[#F9F2E6]/30 transition-colors">
        <h3 className="font-serif text-lg font-medium text-[#3E2723] flex items-center gap-2">{title}</h3>
        <ChevronDown size={18} className={`text-[#C9A96E] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-6 pb-6 space-y-4 border-t border-[#E8DDD0]/50">{children}</div>}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#2C2C2C]/60 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type="text"
        className="w-full bg-white border-2 border-[#E8DDD0] rounded-xl px-4 py-3 text-sm text-[#2C2C2C] focus:outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition"
        value={value} onChange={onChange} placeholder={placeholder}
      />
    </div>
  )
}

function Textarea({ label, value, onChange, rows = 2 }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; rows?: number }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#2C2C2C]/60 uppercase tracking-wider mb-1.5">{label}</label>
      <textarea
        rows={rows}
        className="w-full bg-white border-2 border-[#E8DDD0] rounded-xl px-4 py-3 text-sm text-[#2C2C2C] focus:outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition resize-none"
        value={value} onChange={onChange}
      />
    </div>
  )
}
