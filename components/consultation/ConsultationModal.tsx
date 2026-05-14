"use client"

import { useState, useEffect } from "react"
import { X, CheckCircle, Loader2, Phone, Mail, Send } from "lucide-react"
import { validateEmail, validatePhone, validateName } from "@/lib/validation"

interface Props {
  open: boolean
  onClose: () => void
  source?: string
  // Volitelné kontakty (pokud nezadáno, použijí se defaults)
  phone?: string
  email?: string
}

const DEFAULT_PHONE = "+420 123 456 789"
const DEFAULT_EMAIL = "svatebnimista@svatebnimista.cz"

export default function ConsultationModal({
  open,
  onClose,
  source = "homepage",
  phone = DEFAULT_PHONE,
  email = DEFAULT_EMAIL,
}: Props) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: "", email: "", phone: "", message: "",
    notRobot: false, honeypot: "",
  })
  const [openedAt] = useState(() => Date.now())
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  // Scroll lock pro body — jen závisí na `open`, ne na `onClose`
  // (jinak by se restartoval při každém re-renderu rodiče a hodnota
  // "previousOverflow" by zůstala uložená jako "hidden" → bug:
  // po zavření modalu by body zůstal zamčený).
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  // ESC key handler — samostatný effect závislý na onClose
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  // Reset stavu při zavření (pro příští otevření)
  useEffect(() => {
    if (!open) {
      setShowForm(false)
      setSuccess(false)
    }
  }, [open])

  const phoneTel = phone.replace(/\s/g, "")
  const emailMailto = `mailto:${email}?subject=${encodeURIComponent("Zájem o konzultaci")}`

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (form.honeypot) return
    if (Date.now() - openedAt < 2000) {
      setError("Příliš rychlé odeslání. Zkuste to ještě jednou.")
      return
    }
    if (!form.notRobot) { setError("Potvrďte prosím, že nejste robot."); return }
    const nameErr = validateName(form.name); if (nameErr) { setError(nameErr); return }
    const emailErr = validateEmail(form.email); if (emailErr) { setError(emailErr); return }
    const phoneErr = validatePhone(form.phone); if (phoneErr) { setError(phoneErr); return }
    setLoading(true)
    try {
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, format: "form", timing: "Domluvíme se v e-mailu", source }),
      })
      if (!res.ok) throw new Error()
      setSuccess(true)
    } catch {
      setError("Nepodařilo se odeslat. Zkuste to prosím znovu nebo nám zavolejte.")
    } finally {
      setLoading(false)
    }
  }

  const set = <K extends keyof typeof form>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }))

  const inputCl = "w-full bg-white border-2 border-[#E8DDD0] rounded-xl px-4 py-3 text-base text-[#2C2C2C] placeholder-[#999] focus:outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition"
  const labelCl = "block text-sm font-semibold text-[#2C2C2C] mb-2"

  // Conditional render — VŮBEC žádný Framer Motion na modalu.
  // Framer Motion `scale` transformace mohou v Safari/Chrome způsobit,
  // že child `<a>` linky se neaktivují kvůli rendering kontextu.
  // Místo toho použijeme čisté CSS animace.
  if (!open) return null

  // Backdrop click pattern: zavřít JEN když klik byl přímo na backdrop,
  // ne na obsah modalu (žádné stopPropagation potřeba).
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] bg-black/70 flex items-end sm:items-center justify-center overflow-y-auto animate-fadeIn"
    >
      <div
        className="relative bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl sm:my-8 max-h-[95vh] overflow-y-auto animate-modalIn"
      >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-white border border-[#E8DDD0] hover:bg-[#F9F2E6] flex items-center justify-center text-[#2C2C2C] transition-colors"
              aria-label="Zavřít"
            >
              <X size={18} />
            </button>

            {/* SUCCESS */}
            {success ? (
              <div className="p-8 sm:p-12 text-center">
                <div className="inline-flex w-16 h-16 rounded-full bg-[#C9A96E]/15 items-center justify-center mb-5 animate-popIn">
                  <CheckCircle size={32} className="text-[#C9A96E]" />
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-light text-[#3E2723] mb-3">Děkujeme!</h3>
                <p className="text-[#2C2C2C] leading-relaxed mb-7 max-w-sm mx-auto">
                  Ozveme se vám během <strong>24 hodin</strong>.
                </p>
                <button onClick={onClose} className="bg-[#C9A96E] text-white font-medium px-7 py-3 rounded-full hover:bg-[#A88240] transition-colors">
                  Zavřít
                </button>
              </div>
            ) : showForm ? (
              /* —— PODROBNÝ FORMULÁŘ (skrytý za odkazem) —— */
              <form onSubmit={submit} className="p-6 sm:p-8">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-[#2C2C2C]/60 hover:text-[#3E2723] text-xs font-medium mb-4 inline-flex items-center gap-1"
                >
                  ← Zpět
                </button>

                <h2 className="font-serif text-2xl font-light text-[#2C2C2C] mb-2">
                  Pošlete nám zprávu
                </h2>
                <p className="text-[#2C2C2C]/60 text-sm mb-6">
                  Ozveme se vám do 24 hodin s návrhem konkrétního termínu.
                </p>

                <input type="text" tabIndex={-1} autoComplete="off"
                  value={form.honeypot} onChange={set("honeypot")}
                  style={{ position: "absolute", left: "-9999px", opacity: 0 }} aria-hidden="true" />

                <div className="space-y-3 mb-5">
                  <div>
                    <label className={labelCl}>Jméno a příjmení *</label>
                    <input className={inputCl} placeholder="Jana Nováková" value={form.name} onChange={set("name")} required />
                  </div>
                  <div>
                    <label className={labelCl}>E-mail *</label>
                    <input className={inputCl} type="email" placeholder="vase@email.cz" value={form.email} onChange={set("email")} required />
                  </div>
                  <div>
                    <label className={labelCl}>Telefon *</label>
                    <input className={inputCl} type="tel" placeholder="+420 722 123 456" value={form.phone} onChange={set("phone")} required />
                  </div>
                  <div>
                    <label className={labelCl}>Zpráva (volitelné)</label>
                    <textarea rows={3} className={`${inputCl} resize-none`}
                      placeholder="Krátká zpráva nebo představa o svatbě..."
                      value={form.message} onChange={set("message")} />
                  </div>
                </div>

                <label className="flex items-start gap-3 mb-5 p-4 bg-[#F9F2E6] rounded-xl border-2 border-[#C9A96E]/30 cursor-pointer hover:border-[#C9A96E] transition-colors">
                  <input type="checkbox" checked={form.notRobot}
                    onChange={(e) => setForm((p) => ({ ...p, notRobot: e.target.checked }))}
                    className="mt-0.5 w-5 h-5 accent-[#C9A96E] cursor-pointer flex-shrink-0" />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-[#2C2C2C]">Nejsem robot</span>
                    <span className="block text-xs text-[#2C2C2C]/70 mt-0.5">Potvrzuji, že odesílám lidsky.</span>
                  </span>
                </label>

                {error && <p className="text-red-600 text-sm text-center mb-4 p-3 bg-red-50 rounded-xl border border-red-200">{error}</p>}

                <button type="submit" disabled={loading}
                  className="w-full bg-[#3E2723] text-white font-semibold py-4 rounded-full hover:bg-[#1F1310] disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-base shadow-lg">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {loading ? "Odesílám..." : "Odeslat zprávu"}
                </button>
              </form>
            ) : (
              /* —— RYCHLÝ KONTAKT — DEFAULT —— */
              <div className="p-6 sm:p-8">
                {/* Hlavička */}
                <div className="text-center mb-7 pr-10">
                  <p className="text-[#C9A96E] text-[11px] font-semibold tracking-[.25em] uppercase mb-3">
                    Konzultace zdarma
                  </p>
                  <h2 className="font-serif text-2xl sm:text-3xl font-light leading-tight mb-2 text-[#2C2C2C]">
                    Jsme vám <em className="text-[#3E2723]">k dispozici</em>
                  </h2>
                  <p className="text-[#2C2C2C]/70 text-sm leading-relaxed">
                    Vyberte si nejrychlejší cestu. Ozveme se osobně.
                  </p>
                </div>

                {/* DVA HLAVNÍ KANÁLY: telefon + email */}
                {/* Buttony s programatickou navigací — funguje spolehlivě
                   v Chrome/Edge i Safari (na rozdíl od <a href="tel:">) */}
                <div className="space-y-3">
                  {/* Telefon */}
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent("consultation_phone", source)
                      window.location.href = `tel:${phoneTel}`
                    }}
                    className="group w-full text-left flex items-center gap-4 bg-[#C9A96E]/10 hover:bg-[#C9A96E]/20 border-2 border-[#C9A96E]/40 hover:border-[#C9A96E] rounded-2xl p-4 sm:p-5 transition-all cursor-pointer"
                  >
                    <span className="w-12 h-12 rounded-full bg-[#C9A96E] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Phone className="text-white w-5 h-5" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[10px] font-semibold tracking-[.2em] uppercase text-[#A88240] mb-0.5">
                        Zavolejte
                      </span>
                      <span className="block font-serif text-lg sm:text-xl text-[#2C2C2C]">
                        {phone}
                      </span>
                      <span className="block text-xs text-[#2C2C2C]/60 mt-0.5">
                        Po–Pá, 9:00 – 18:00
                      </span>
                    </span>
                    <span className="text-[#C9A96E] text-xl font-light flex-shrink-0">→</span>
                  </button>

                  {/* E-mail */}
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent("consultation_email", source)
                      window.location.href = emailMailto
                    }}
                    className="group w-full text-left flex items-center gap-4 bg-[#3E2723]/5 hover:bg-[#3E2723]/10 border-2 border-[#3E2723]/20 hover:border-[#3E2723]/40 rounded-2xl p-4 sm:p-5 transition-all cursor-pointer"
                  >
                    <span className="w-12 h-12 rounded-full bg-[#3E2723] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Mail className="text-white w-5 h-5" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[10px] font-semibold tracking-[.2em] uppercase text-[#3E2723] mb-0.5">
                        Napište e-mail
                      </span>
                      <span className="block font-medium text-[#2C2C2C] text-sm sm:text-base truncate">
                        {email}
                      </span>
                      <span className="block text-xs text-[#2C2C2C]/60 mt-0.5">
                        Odpovíme do 24 hodin
                      </span>
                    </span>
                    <span className="text-[#3E2723] text-xl font-light flex-shrink-0">→</span>
                  </button>
                </div>

                {/* Vedlejší volba — formulář */}
                <div className="mt-6 pt-5 border-t border-[#E8DDD0] text-center">
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="text-[#2C2C2C]/70 hover:text-[#3E2723] text-sm font-medium underline decoration-[#C9A96E] decoration-2 underline-offset-4 transition-colors"
                  >
                    Nebo nám pošlete zprávu přes formulář
                  </button>
                </div>

                {/* Trust signal */}
                <div className="mt-6 flex items-center justify-center gap-x-4 gap-y-1 flex-wrap text-[11px] text-[#2C2C2C]/50">
                  <span>Zdarma</span>
                  <span className="text-[#C9A96E]">•</span>
                  <span>Bez závazku</span>
                  <span className="text-[#C9A96E]">•</span>
                  <span>Odpověď do 24 hod</span>
                </div>
              </div>
            )}
      </div>
    </div>
  )
}

/* Tracking placeholder — pokud později přidáš Plausible/GA */
function trackEvent(_action: string, _source?: string) {
  // window.plausible?.(action, { props: { source } })
}
