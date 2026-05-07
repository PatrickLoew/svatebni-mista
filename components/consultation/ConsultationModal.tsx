"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle, Loader2, Calendar, Phone, Video, MapPin } from "lucide-react"
import { validateEmail, validatePhone, validateName } from "@/lib/validation"

interface Props {
  open: boolean
  onClose: () => void
  source?: string
}

const FORMATS = [
  { id: "online", label: "Online", sub: "Zoom / Meet", icon: Video },
  { id: "osobne", label: "Osobně", sub: "v Praze", icon: MapPin },
  { id: "telefon", label: "Telefon", sub: "klasický hovor", icon: Phone },
]

const TIME_SLOTS = [
  "Co nejdříve",
  "Tento týden",
  "Příští týden",
  "Tento měsíc",
  "Domluvíme se v e-mailu",
]

export default function ConsultationModal({ open, onClose, source = "homepage" }: Props) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    format: "online", timing: "Co nejdříve", message: "",
    notRobot: false, honeypot: "",
  })
  const [openedAt] = useState(() => Date.now())
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (form.honeypot) return
    if (Date.now() - openedAt < 2000) {
      setError("Příliš rychlé odeslání. Zkuste to ještě jednou.")
      return
    }
    if (!form.notRobot) {
      setError("Potvrďte prosím, že nejste robot.")
      return
    }
    // Validace
    const nameErr = validateName(form.name)
    if (nameErr) { setError(nameErr); return }
    const emailErr = validateEmail(form.email)
    if (emailErr) { setError(emailErr); return }
    const phoneErr = validatePhone(form.phone)
    if (phoneErr) { setError(phoneErr); return }

    setLoading(true)
    try {
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source }),
      })
      if (!res.ok) throw new Error()
      setSuccess(true)
    } catch {
      setError("Nepodařilo se odeslat. Zkuste to prosím znovu.")
    } finally {
      setLoading(false)
    }
  }

  const set = <K extends keyof typeof form>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }))

  // Vyšší kontrast: tmavý text na bílém pozadí
  const inputCl = "w-full bg-white border-2 border-[#E8DDD0] rounded-xl px-4 py-3 text-base text-[#2C2C2C] placeholder-[#999] focus:outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition"
  const labelCl = "block text-sm font-semibold text-[#2C2C2C] mb-2"

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.95, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 30 }}
            transition={{ type: "spring", duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white w-full sm:max-w-xl sm:rounded-3xl rounded-t-3xl shadow-2xl sm:my-8 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-white border border-[#E8DDD0] hover:bg-[#F9F2E6] flex items-center justify-center text-[#2C2C2C] transition-colors"
              aria-label="Zavřít"
            >
              <X size={18} />
            </button>

            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 sm:p-12 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="inline-flex w-16 h-16 rounded-full bg-[#C9A96E]/15 items-center justify-center mb-5"
                >
                  <CheckCircle size={32} className="text-[#C9A96E]" />
                </motion.div>
                <h3 className="font-serif text-2xl sm:text-3xl font-light text-[#1F3A2C] mb-3">
                  Děkujeme!
                </h3>
                <p className="text-[#2C2C2C] leading-relaxed mb-7 max-w-sm mx-auto">
                  Ozveme se vám během <strong>24 hodin</strong> s návrhem
                  konkrétních termínů a formou konzultace.
                </p>
                <button
                  onClick={onClose}
                  className="bg-[#C9A96E] text-white font-medium px-7 py-3 rounded-full hover:bg-[#A88240] transition-colors"
                >
                  Zavřít
                </button>
              </motion.div>
            ) : (
              <form onSubmit={submit} className="p-6 sm:p-8 md:p-10">
                {/* Hlavička */}
                <div className="mb-6 pr-10">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={14} className="text-[#C9A96E] flex-shrink-0" />
                    <span className="text-[#C9A96E] text-[11px] font-semibold tracking-[.25em] uppercase">
                      Konzultace zdarma
                    </span>
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-light leading-tight mb-2 text-[#2C2C2C]">
                    Domluvte si <em className="text-[#1F3A2C]">individuální konzultaci</em>
                  </h2>
                  <p className="text-[#2C2C2C]/70 text-sm leading-relaxed">
                    30 minut s naším wedding plannerem. Zdarma a bez závazku.
                  </p>
                </div>

                {/* Honeypot */}
                <input
                  type="text" tabIndex={-1} autoComplete="off"
                  value={form.honeypot} onChange={set("honeypot")}
                  style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}
                  aria-hidden="true"
                />

                {/* Kontaktní údaje s inline validací */}
                <div className="space-y-3 mb-6">
                  {(() => {
                    const nameErr = form.name ? validateName(form.name) : ""
                    const emailErr = form.email ? validateEmail(form.email) : ""
                    const phoneErr = form.phone ? validatePhone(form.phone) : ""
                    const errCl = (err: string) => err
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                      : "border-[#E8DDD0] focus:border-[#C9A96E] focus:ring-[#C9A96E]/20"
                    return (
                      <>
                        <div>
                          <label className={labelCl}>Jméno a příjmení *</label>
                          <input
                            className={`w-full bg-white border-2 ${errCl(nameErr)} rounded-xl px-4 py-3 text-base text-[#2C2C2C] placeholder-[#999] focus:outline-none focus:ring-2 transition`}
                            placeholder="např. Lucie Nováková"
                            value={form.name} onChange={set("name")} required
                          />
                          {nameErr && <p className="mt-1.5 text-xs text-red-600">{nameErr}</p>}
                        </div>
                        <div>
                          <label className={labelCl}>E-mail *</label>
                          <input
                            className={`w-full bg-white border-2 ${errCl(emailErr)} rounded-xl px-4 py-3 text-base text-[#2C2C2C] placeholder-[#999] focus:outline-none focus:ring-2 transition`}
                            type="email" placeholder="vase@email.cz"
                            value={form.email} onChange={set("email")} required
                          />
                          {emailErr && <p className="mt-1.5 text-xs text-red-600">{emailErr}</p>}
                        </div>
                        <div>
                          <label className={labelCl}>Telefon *</label>
                          <input
                            className={`w-full bg-white border-2 ${errCl(phoneErr)} rounded-xl px-4 py-3 text-base text-[#2C2C2C] placeholder-[#999] focus:outline-none focus:ring-2 transition`}
                            type="tel" placeholder="+420 722 123 456"
                            value={form.phone} onChange={set("phone")} required
                          />
                          {phoneErr && <p className="mt-1.5 text-xs text-red-600">{phoneErr}</p>}
                        </div>
                      </>
                    )
                  })()}
                </div>

                {/* Forma konzultace */}
                <div className="mb-5">
                  <label className={labelCl}>Forma konzultace</label>
                  <div className="grid grid-cols-3 gap-2">
                    {FORMATS.map((f) => {
                      const on = form.format === f.id
                      return (
                        <button
                          type="button"
                          key={f.id}
                          onClick={() => setForm((p) => ({ ...p, format: f.id }))}
                          className={`px-2 py-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                            on
                              ? "bg-[#1F3A2C] text-white border-[#1F3A2C] shadow-md"
                              : "bg-white text-[#2C2C2C] border-[#E8DDD0] hover:border-[#C9A96E] hover:bg-[#F9F2E6]"
                          }`}
                        >
                          <f.icon size={18} className={on ? "text-[#E8C98A]" : "text-[#1F3A2C]"} />
                          <div className="text-center">
                            <div className="text-xs font-semibold">{f.label}</div>
                            <div className={`text-[10px] mt-0.5 ${on ? "text-white/70" : "text-[#2C2C2C]/50"}`}>
                              {f.sub}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Termín */}
                <div className="mb-5">
                  <label className={labelCl}>Kdy by vám to vyhovovalo?</label>
                  <select className={`${inputCl} cursor-pointer`} value={form.timing} onChange={set("timing")}>
                    {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Zpráva */}
                <div className="mb-5">
                  <label className={labelCl}>Krátká zpráva <span className="text-[#2C2C2C]/40 font-normal">(volitelné)</span></label>
                  <textarea
                    rows={3}
                    className={`${inputCl} resize-none`}
                    placeholder="Specifická otázka nebo představa o svatbě..."
                    value={form.message}
                    onChange={set("message")}
                  />
                </div>

                {/* Captcha — VYSOKÝ kontrast */}
                <label className="flex items-start gap-3 mb-5 p-4 bg-[#F9F2E6] rounded-xl border-2 border-[#C9A96E]/30 cursor-pointer hover:border-[#C9A96E] transition-colors">
                  <input
                    type="checkbox"
                    checked={form.notRobot}
                    onChange={(e) => setForm((p) => ({ ...p, notRobot: e.target.checked }))}
                    className="mt-0.5 w-5 h-5 accent-[#C9A96E] cursor-pointer flex-shrink-0"
                  />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-[#2C2C2C]">Nejsem robot</span>
                    <span className="block text-xs text-[#2C2C2C]/70 mt-0.5">Potvrzuji, že odesílám lidsky.</span>
                  </span>
                </label>

                {error && (
                  <p className="text-red-600 text-sm text-center mb-4 p-3 bg-red-50 rounded-xl border border-red-200">
                    {error}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1F3A2C] text-white font-semibold py-4 rounded-full hover:bg-[#0F1F18] disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-base shadow-lg"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Calendar size={18} />}
                  {loading ? "Odesílám..." : "Domluvit konzultaci"}
                </button>

                <p className="text-center text-[#2C2C2C]/50 text-xs mt-4">
                  Zdarma · Bez závazku · Odpověď do 24 hodin
                </p>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
