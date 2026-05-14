"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, X, Upload, Image as ImageIcon } from "lucide-react"
import { REGIONS, VENUE_TYPES, NEAREST_CITIES } from "@/lib/utils"
import type { Venue } from "@/lib/types"

interface Props { initial?: Partial<Venue>; id?: string }

export default function VenueForm({ initial, id }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    slug:        initial?.slug ?? "",
    title:       initial?.title ?? "",
    description: initial?.description ?? "",
    location:    initial?.location ?? "",
    region:      initial?.region ?? "",
    type:        initial?.type ?? "",
    capacity:    initial?.capacity ?? 100,
    priceFrom:   initial?.priceFrom ?? 50000,
    isFeatured:  initial?.isFeatured ?? false,
    services:    initial?.services ?? ([] as string[]),
    images:      initial?.images ?? ([] as string[]),
    features:    initial?.features ?? ([] as string[]),
    // Nová pole
    websiteUrl:            initial?.websiteUrl ?? "",
    contactEmail:          initial?.contactEmail ?? "",
    nearestCity:           initial?.nearestCity ?? "",
    accommodationCapacity: initial?.accommodationCapacity ?? 0,
    cateringPolicy:        initial?.cateringPolicy ?? "",
    nightPartyPolicy:      initial?.nightPartyPolicy ?? "",
    avgWeddingCost:        initial?.avgWeddingCost ?? 0,
  })

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({
    ...f,
    [k]: e.target.type === "checkbox"
      ? (e.target as HTMLInputElement).checked
      : e.target.value
  }))

  const addTag = (field: "services" | "images" | "features", val: string) => {
    if (!val.trim()) return
    setForm((f) => ({ ...f, [field]: [...(f[field] as string[]), val.trim()] }))
  }

  const removeTag = (field: "services" | "images" | "features", idx: number) =>
    setForm((f) => ({ ...f, [field]: (f[field] as string[]).filter((_, i) => i !== idx) }))

  // Upload obrázku z disku do Supabase Storage
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadError("")
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/upload-image", { method: "POST", body: fd })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Upload selhal")
        setForm((f) => ({ ...f, images: [...f.images, data.url] }))
      }
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload selhal")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // Auto-slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    setForm((f) => ({
      ...f,
      title,
      slug: f.slug || title.toLowerCase()
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch(id ? `/api/venues/${id}` : "/api/venues", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      router.push("/admin/venues")
      router.refresh()
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-white border border-[#E8DDD0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C9A96E] transition"
  const labelClass = "block text-xs font-semibold text-charcoal/60 uppercase tracking-wider mb-1.5"
  const sectionClass = "bg-white border border-[#E8DDD0] rounded-2xl p-6 space-y-4"
  const sectionTitleClass = "font-serif text-lg font-medium text-[#3E2723] mb-2 flex items-center gap-2"

  function TagInput({ field, placeholder }: { field: "services" | "images" | "features"; placeholder: string }) {
    const [val, setVal] = useState("")
    return (
      <div>
        <div className="flex gap-2 mb-2">
          <input
            className={inputClass}
            placeholder={placeholder}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(field, val); setVal("") } }}
          />
          <button type="button" onClick={() => { addTag(field, val); setVal("") }}
            className="bg-[#C9A96E] text-white rounded-xl px-4 hover:bg-[#A88240] transition-colors">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(form[field] as string[]).map((tag, i) => (
            <span key={i} className="flex items-center gap-1 bg-[#F9F2E6] border border-[#C9A96E]/30 text-charcoal text-xs px-3 py-1 rounded-full">
              {tag.length > 50 ? tag.slice(0, 50) + "…" : tag}
              <button type="button" onClick={() => removeTag(field, i)} className="text-charcoal/40 hover:text-red-500 ml-1"><X size={11} /></button>
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-6 max-w-3xl pb-12">
      {/* SEKCE 1: Základní informace */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Základní informace</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Název místa *</label>
            <input className={inputClass} value={form.title} onChange={handleTitleChange} required placeholder="Zámek Hluboká" />
          </div>
          <div>
            <label className={labelClass}>Slug (URL adresa) *</label>
            <input className={inputClass} value={form.slug} onChange={set("slug")} required placeholder="zamek-hluboka" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Popis *</label>
          <textarea className={`${inputClass} resize-none`} rows={4} value={form.description} onChange={set("description")} required placeholder="Krátký popis místa, atmosféry a co ho dělá výjimečným..." />
        </div>
      </div>

      {/* SEKCE 2: Lokalita */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Lokalita</h3>

        <div>
          <label className={labelClass}>Lokalita (text pro zobrazení) *</label>
          <input className={inputClass} value={form.location} onChange={set("location")} required placeholder="Hluboká nad Vltavou, Jihočeský kraj" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Kraj *</label>
            <select className={inputClass} value={form.region} onChange={set("region")} required>
              <option value="">Vyberte kraj</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Nejbližší velké město</label>
            <select className={inputClass} value={form.nearestCity} onChange={set("nearestCity")}>
              <option value="">— Žádné —</option>
              {NEAREST_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* SEKCE 3: Kapacita & cena */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Kapacita a cena</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Typ místa *</label>
            <select className={inputClass} value={form.type} onChange={set("type")} required>
              <option value="">Vyberte typ</option>
              {VENUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Kapacita (hostů)</label>
            <input className={inputClass} type="number" min={1} value={form.capacity} onChange={set("capacity")} />
          </div>
          <div>
            <label className={labelClass}>Ubytování na místě (lůžek)</label>
            <input className={inputClass} type="number" min={0} value={form.accommodationCapacity} onChange={set("accommodationCapacity")} placeholder="0 = nemáme" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Pronájem od (Kč)</label>
            <input className={inputClass} type="number" min={0} value={form.priceFrom} onChange={set("priceFrom")} />
          </div>
          <div>
            <label className={labelClass}>Průměrná cena svatby (Kč)</label>
            <input className={inputClass} type="number" min={0} value={form.avgWeddingCost} onChange={set("avgWeddingCost")} placeholder="Volitelné" />
          </div>
        </div>
      </div>

      {/* SEKCE 4: Catering & Party */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Catering a party</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Pravidla cateringu</label>
            <select className={inputClass} value={form.cateringPolicy} onChange={set("cateringPolicy")}>
              <option value="">— Nezadáno —</option>
              <option value="own_free">Vlastní jídlo i pití zdarma</option>
              <option value="own_drinks_free">Vlastní pití zdarma, catering od místa</option>
              <option value="only_venue">Pouze catering od místa</option>
              <option value="negotiable">Dle domluvy</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Pravidla noční party</label>
            <select className={inputClass} value={form.nightPartyPolicy} onChange={set("nightPartyPolicy")}>
              <option value="">— Nezadáno —</option>
              <option value="no_curfew">Bez nočního klidu (do rána)</option>
              <option value="indoor_after_22">Po 22:00 v párty místnosti</option>
              <option value="quiet_hours">Klidová zóna</option>
            </select>
          </div>
        </div>
      </div>

      {/* SEKCE 5: Kontakt */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Kontakt na místo</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>E-mail</label>
            <input className={inputClass} type="email" value={form.contactEmail} onChange={set("contactEmail")} placeholder="info@zamek.cz" />
          </div>
          <div>
            <label className={labelClass}>Web</label>
            <input className={inputClass} type="url" value={form.websiteUrl} onChange={set("websiteUrl")} placeholder="https://www.zamek.cz" />
          </div>
        </div>
      </div>

      {/* SEKCE 6: Fotky, služby, vybavení */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Fotky a služby</h3>

        <div>
          <label className={labelClass}>Fotky místa</label>
          <p className="text-xs text-charcoal/50 mb-2">Nahrajte z disku (JPG/PNG/WebP, max 10 MB) nebo vložte URL.</p>

          {/* Upload tlačítko */}
          <div className="flex flex-wrap gap-3 mb-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 bg-[#C9A96E] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#A88240] transition-colors disabled:opacity-60"
            >
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              {uploading ? "Nahrávám…" : "Nahrát fotku z disku"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
          {uploadError && <p className="text-red-600 text-xs mb-3">{uploadError}</p>}

          {/* Preview grid */}
          {form.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
              {form.images.map((url, i) => (
                <div key={`${url}-${i}`} className="relative group aspect-[4/3] bg-[#F9F2E6] border border-[#E8DDD0] rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`foto ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeTag("images", i)}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                    aria-label="Smazat fotku"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Fallback: zadat URL ručně */}
          <details className="text-xs">
            <summary className="cursor-pointer text-charcoal/60 hover:text-[#C9A96E]">
              Nebo přidat URL ručně (např. z Unsplash)
            </summary>
            <div className="mt-3">
              <TagInput field="images" placeholder="https://images.unsplash.com/..." />
            </div>
          </details>

          {form.images.length === 0 && (
            <p className="text-xs text-charcoal/50 mt-2 flex items-center gap-1.5">
              <ImageIcon size={13} /> Zatím žádné fotky — doporučujeme alespoň 3.
            </p>
          )}
        </div>

        <div>
          <label className={labelClass}>Nabízené služby</label>
          <p className="text-xs text-charcoal/50 mb-2">Co místo nabízí (catering, fotograf, hudba...)</p>
          <TagInput field="services" placeholder="Catering" />
        </div>

        <div>
          <label className={labelClass}>Vybavení a přidané hodnoty</label>
          <p className="text-xs text-charcoal/50 mb-2">Co dělá místo výjimečným (rybníček, sauna, parkování...)</p>
          <TagInput field="features" placeholder="Sauna" />
        </div>
      </div>

      {/* SEKCE 7: Zviditelnění */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Zviditelnění</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.isFeatured}
            onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
            className="accent-[#C9A96E] w-5 h-5" />
          <div>
            <span className="text-sm font-medium">Doporučené místo</span>
            <p className="text-xs text-charcoal/50">Zobrazí se na hlavní stránce v sekci „Doporučená místa".</p>
          </div>
        </label>
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

      {/* Actions */}
      <div className="flex gap-3 sticky bottom-4 bg-white/80 backdrop-blur-md p-4 -mx-4 rounded-2xl border border-[#E8DDD0]">
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 bg-[#3E2723] text-white font-semibold px-8 py-3.5 rounded-full hover:bg-[#1F1310] transition-colors disabled:opacity-60">
          {loading && <Loader2 size={16} className="animate-spin" />}
          {id ? "Uložit změny" : "Přidat místo"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-8 py-3.5 border border-[#E8DDD0] rounded-full text-sm font-semibold hover:bg-[#E8DDD0] transition-colors">
          Zrušit
        </button>
      </div>
    </form>
  )
}
