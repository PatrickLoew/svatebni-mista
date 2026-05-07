"use client"

import { useEffect, useState } from "react"
import { Loader2, Save, CheckCircle } from "lucide-react"
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
      .then((data) => setS(data))
      .finally(() => setLoading(false))
  }, [])

  const set = <K extends keyof SiteSettings>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setS((p) => ({ ...p, [k]: e.target.value }))

  async function save() {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  const inputCl = "w-full bg-white border-2 border-[#E8DDD0] rounded-xl px-4 py-3 text-sm text-[#2C2C2C] focus:outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition"
  const labelCl = "block text-xs font-semibold text-[#2C2C2C]/60 uppercase tracking-wider mb-1.5"
  const sectionCl = "bg-white border border-[#E8DDD0] rounded-2xl p-6 space-y-4"
  const sectionTitleCl = "font-serif text-lg font-medium text-[#3E2723] mb-3"

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div className="max-w-3xl pb-24">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-light mb-1">Nastavení webu</h1>
        <p className="text-charcoal/60 text-sm">Změny se ihned projeví na celém webu.</p>
      </div>

      <div className="space-y-6">
        {/* Kontakt */}
        <div className={sectionCl}>
          <h3 className={sectionTitleCl}>Kontaktní údaje</h3>
          <p className="text-xs text-charcoal/50 -mt-2 mb-3">Zobrazí se v patičce, sekci konzultace a v e-mailech.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCl}>Telefon</label>
              <input className={inputCl} value={s.phone} onChange={set("phone")} placeholder="+420 722 123 456" />
            </div>
            <div>
              <label className={labelCl}>WhatsApp (bez mezer)</label>
              <input className={inputCl} value={s.whatsapp} onChange={set("whatsapp")} placeholder="+420722123456" />
            </div>
            <div>
              <label className={labelCl}>E-mail</label>
              <input className={inputCl} value={s.email} onChange={set("email")} placeholder="info@svatebnimista.cz" />
            </div>
            <div>
              <label className={labelCl}>Otevírací doba</label>
              <input className={inputCl} value={s.hours} onChange={set("hours")} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCl}>Adresa</label>
              <input className={inputCl} value={s.address} onChange={set("address")} />
            </div>
          </div>
          <p className="text-xs text-charcoal/50 mt-2">
            <strong>WhatsApp</strong>: zadej bez mezer s předvolbou (např. <code>+420722123456</code>) — tlačítko otevře přímo chat.
          </p>
        </div>

        {/* Hero texty */}
        <div className={sectionCl}>
          <h3 className={sectionTitleCl}>Hlavní stránka — Hero</h3>
          <p className="text-xs text-charcoal/50 -mt-2 mb-3">Texty na úvodní obrazovce.</p>

          <div>
            <label className={labelCl}>Eyebrow (malý zlatý text nahoře)</label>
            <input className={inputCl} value={s.heroEyebrow} onChange={set("heroEyebrow")} />
          </div>

          <div>
            <label className={labelCl}>Hlavní nadpis — řádek 1</label>
            <input className={inputCl} value={s.heroTitleLine1} onChange={set("heroTitleLine1")} />
          </div>
          <div>
            <label className={labelCl}>Hlavní nadpis — řádek 2 (zlatý italic)</label>
            <input className={inputCl} value={s.heroTitleLine2} onChange={set("heroTitleLine2")} />
          </div>
          <div>
            <label className={labelCl}>Hlavní nadpis — řádek 3</label>
            <input className={inputCl} value={s.heroTitleLine3} onChange={set("heroTitleLine3")} />
          </div>

          <div>
            <label className={labelCl}>Podnadpis</label>
            <textarea className={`${inputCl} resize-none`} rows={3} value={s.heroSubtitle} onChange={set("heroSubtitle")} />
          </div>
        </div>

        {/* Statistiky */}
        <div className={sectionCl}>
          <h3 className={sectionTitleCl}>Statistiky a čísla</h3>
          <p className="text-xs text-charcoal/50 -mt-2 mb-3">Zobrazené v Hero glass kartách a sekci recenzí.</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className={labelCl}>Svateb organizovaných</label>
              <input className={inputCl} value={s.statWeddings} onChange={set("statWeddings")} placeholder="500+" />
            </div>
            <div>
              <label className={labelCl}>Hodnocení</label>
              <input className={inputCl} value={s.statRating} onChange={set("statRating")} placeholder="4,9 ★" />
            </div>
            <div>
              <label className={labelCl}>Počet míst</label>
              <input className={inputCl} value={s.statVenues} onChange={set("statVenues")} placeholder="200+" />
            </div>
            <div>
              <label className={labelCl}>Let zkušeností</label>
              <input className={inputCl} value={s.statYears} onChange={set("statYears")} placeholder="7" />
            </div>
          </div>
        </div>

        {/* Závěrečný citát */}
        <div className={sectionCl}>
          <h3 className={sectionTitleCl}>Závěrečný citát</h3>
          <p className="text-xs text-charcoal/50 -mt-2 mb-3">Zobrazí se na konci sekce konzultace.</p>

          <div>
            <label className={labelCl}>Citát</label>
            <textarea className={`${inputCl} resize-none italic`} rows={3} value={s.closingQuote} onChange={set("closingQuote")} />
          </div>
          <div>
            <label className={labelCl}>Podpis</label>
            <input className={inputCl} value={s.closingSignature} onChange={set("closingSignature")} />
          </div>
        </div>

        {/* Sociální sítě */}
        <div className={sectionCl}>
          <h3 className={sectionTitleCl}>Sociální sítě</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCl}>Instagram URL</label>
              <input className={inputCl} value={s.instagramUrl} onChange={set("instagramUrl")} placeholder="https://instagram.com/svatebnimista" />
            </div>
            <div>
              <label className={labelCl}>Facebook URL</label>
              <input className={inputCl} value={s.facebookUrl} onChange={set("facebookUrl")} placeholder="https://facebook.com/svatebnimista" />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 mt-8 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-[#E8DDD0] shadow-lg flex items-center justify-between gap-4">
        <div className="text-sm">
          {saved ? (
            <span className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle size={16} /> Uloženo!
            </span>
          ) : (
            <span className="text-charcoal/60">Změny se uloží okamžitě po kliknutí.</span>
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
