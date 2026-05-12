"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle, Loader2, Phone, Mail, Send } from "lucide-react"
import { validateEmail, validatePhone, validateName } from "@/lib/validation"

interface Props {
  open: boolean
  onClose: () => void
  source?: string
  // Volitelné kontakty (pokud nezadáno, použijí se defaults)
  phone?: string
  whatsapp?: string
  email?: string
}

const DEFAULT_PHONE = "+420 123 456 789"
const DEFAULT_WHATSAPP = "+420123456789"
const DEFAULT_EMAIL = "svatebnimista@svatebnimista.cz"

const WHATSAPP_MESSAGE = "Dobrý den, mám zájem o nezávaznou konzultaci ke svatbě. Můžeme se domluvit?"

export default function ConsultationModal({
  open,
  onClose,
  source = "homepage",
  phone = DEFAULT_PHONE,
  whatsapp = DEFAULT_WHATSAPP,
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

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else { document.body.style.overflow = ""; setShowForm(false); setSuccess(false) }
    return () => { document.body.style.overflow = "" }
  }, [open])

  // WhatsApp link s předvyplněnou zprávou
  const phoneClean = whatsapp.replace(/\s|\+/g, "")
  const whatsappUrl = `https://wa.me/${phoneClean}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
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
            className="relative bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl sm:my-8 max-h-[95vh] overflow-y-auto"
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
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="inline-flex w-16 h-16 rounded-full bg-[#C9A96E]/15 items-center justify-center mb-5"
                >
                  <CheckCircle size={32} className="text-[#C9A96E]" />
                </motion.div>
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

                {/* TŘI HLAVNÍ KANÁLY */}
                <div className="space-y-3">
                  {/* WhatsApp — primární CTA */}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent("consultation_whatsapp", source)}
                    className="group flex items-center gap-4 bg-[#25D366]/10 hover:bg-[#25D366]/15 border-2 border-[#25D366]/30 hover:border-[#25D366] rounded-2xl p-4 sm:p-5 transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <WhatsAppIcon className="text-white w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold tracking-[.2em] uppercase text-[#25D366] mb-0.5">
                        Nejrychlejší
                      </div>
                      <div className="font-semibold text-[#2C2C2C] text-base">
                        Napište nám na WhatsApp
                      </div>
                      <div className="text-xs text-[#2C2C2C]/60 mt-0.5">
                        Otevře se chat s předvyplněnou zprávou
                      </div>
                    </div>
                    <span className="text-[#25D366] text-xl font-light flex-shrink-0">→</span>
                  </a>

                  {/* Telefon */}
                  <a
                    href={`tel:${phoneTel}`}
                    onClick={() => trackEvent("consultation_phone", source)}
                    className="group flex items-center gap-4 bg-[#C9A96E]/10 hover:bg-[#C9A96E]/15 border-2 border-[#C9A96E]/40 hover:border-[#C9A96E] rounded-2xl p-4 sm:p-5 transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#C9A96E] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Phone className="text-white w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold tracking-[.2em] uppercase text-[#A88240] mb-0.5">
                        Zavolejte
                      </div>
                      <div className="font-serif text-lg sm:text-xl text-[#2C2C2C]">
                        {phone}
                      </div>
                      <div className="text-xs text-[#2C2C2C]/60 mt-0.5">
                        Po–Pá, 9:00 – 18:00
                      </div>
                    </div>
                    <span className="text-[#C9A96E] text-xl font-light flex-shrink-0">→</span>
                  </a>

                  {/* E-mail */}
                  <a
                    href={emailMailto}
                    onClick={() => trackEvent("consultation_email", source)}
                    className="group flex items-center gap-4 bg-[#3E2723]/5 hover:bg-[#3E2723]/10 border-2 border-[#3E2723]/20 hover:border-[#3E2723]/40 rounded-2xl p-4 sm:p-5 transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#3E2723] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Mail className="text-white w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold tracking-[.2em] uppercase text-[#3E2723] mb-0.5">
                        Napište e-mail
                      </div>
                      <div className="font-medium text-[#2C2C2C] text-sm sm:text-base truncate">
                        {email}
                      </div>
                      <div className="text-xs text-[#2C2C2C]/60 mt-0.5">
                        Odpovíme do 24 hodin
                      </div>
                    </div>
                    <span className="text-[#3E2723] text-xl font-light flex-shrink-0">→</span>
                  </a>
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* WhatsApp ikona (v lucide-react není) */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

/* Tracking placeholder — pokud později přidáš Plausible/GA */
function trackEvent(_action: string, _source?: string) {
  // window.plausible?.(action, { props: { source } })
}
