"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Loader2, CheckCircle, Send } from "lucide-react"
import { validateEmail, validateName, validatePhone } from "@/lib/validation"

interface FormState {
  weddingTerm: string
  location: string
  guests: string
  venueStyle: string
  accommodation: string
  ceremony: string
  catering: string
  nightCurfew: string
  rentalBudget: string
  weddingBudget: string
  specialRequests: string
  name: string
  email: string
  phone: string
  notRobot: boolean
  consent: boolean
  honeypot: string
}

const initial: FormState = {
  weddingTerm: "", location: "", guests: "", venueStyle: "",
  accommodation: "", ceremony: "", catering: "", nightCurfew: "",
  rentalBudget: "", weddingBudget: "", specialRequests: "",
  name: "", email: "", phone: "",
  notRobot: false, consent: false, honeypot: "",
}

export default function MainCtaForm() {
  const [f, setF] = useState<FormState>(initial)
  const [openedAt] = useState(() => Date.now())
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const set = <K extends keyof FormState>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setF((p) => ({ ...p, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (f.honeypot) return
    if (Date.now() - openedAt < 2000) {
      setError("Příliš rychlé odeslání. Zkuste to prosím znovu.")
      return
    }
    if (!f.notRobot) { setError("Potvrďte prosím, že nejste robot."); return }
    if (!f.consent) { setError("Souhlas se zpracováním údajů je nutný."); return }
    const nameErr = validateName(f.name); if (nameErr) { setError(nameErr); return }
    const emailErr = validateEmail(f.email); if (emailErr) { setError(emailErr); return }
    const phoneErr = validatePhone(f.phone); if (phoneErr) { setError(phoneErr); return }

    setLoading(true)
    try {
      // Mapování na strukturu kterou očekává /api/match
      const seasonMap: Record<string, string> = {
        "leto": "leto", "podzim": "podzim", "jaro": "jaro", "jedno": "jedno",
      }
      const accomMap: Record<string, string> = {
        "primo": "primo", "okoli": "okoli", "neni": "neni",
      }
      const cateringMap: Record<string, string> = {
        "vlastni-vse": "vlastni-vse", "vse-od-mista": "vse-od-mista",
        "vlastni-piti": "vlastni-piti", "jedno": "jedno",
      }
      const partyMap: Record<string, string> = {
        "no_curfew": "velka-bez-klidu", "indoor_after_22": "pohoda", "do_22": "do-22", "jedno": "jedno",
      }

      const body = {
        season: seasonMap[f.weddingTerm.toLowerCase()] || "jedno",
        weddingYear: parseInt(f.weddingTerm.match(/\d{4}/)?.[0] ?? "2027") || 2027,
        guests: parseInt(f.guests) || 80,
        regions: [],
        nearestCity: undefined,
        archType: f.venueStyle || "jedno",
        accommodation: accomMap[f.accommodation] || "primo",
        weddingMode: f.ceremony === "ano" ? "komplet" : "obrad-hostina",
        catering: cateringMap[f.catering] || "jedno",
        party: partyMap[f.nightCurfew] || "pohoda",
        rentalBudget: parseInt(f.rentalBudget.replace(/\D/g, "")) || 0,
        weddingBudget: parseInt(f.weddingBudget.replace(/\D/g, "")) || 0,
        specialRequests: f.specialRequests + (f.location ? `\n\nLokalita: ${f.location}` : ""),
        serviceHelp: ["mista"],
        needCoordinator: "uz-mam",
        needDjModerator: "uz-mam",
        needPhotographer: "uz-mam",
        wantOnlineConsultation: false,
        name: f.name,
        email: f.email,
        phone: f.phone,
        consentGdpr: f.consent,
        consentNewsletter: false,
        notRobot: f.notRobot,
        honeypot: f.honeypot,
      }

      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      setSuccess(true)
    } catch {
      setError("Nepodařilo se odeslat. Zkuste to prosím znovu nebo nám zavolejte.")
    } finally {
      setLoading(false)
    }
  }

  const inputCl = "w-full bg-white border border-[#E8DDD0] rounded-xl px-4 py-3 text-sm text-[#2C2C2C] placeholder-[#999] focus:outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/15 transition"
  const labelCl = "block text-xs font-semibold text-[#2C2C2C] mb-2"
  const selectCl = `${inputCl} cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 fill=%22none%22 stroke=%22%23999%22 stroke-width=%222%22><polyline points=%221,4 6,9 11,4%22/></svg>')] bg-no-repeat bg-[right_1rem_center]`

  return (
    <section id="hlavni-cta" className="py-24 md:py-32 px-6 md:px-10 bg-gradient-to-br from-[#F9F2E6] via-[#F0E8DC] to-[#FEFDFB]">
      <div className="max-w-7xl mx-auto">
        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-[#E8DDD0] rounded-3xl p-12 md:p-20 text-center max-w-2xl mx-auto shadow-lg"
          >
            <div className="inline-flex w-16 h-16 rounded-full bg-[#C9A96E]/15 items-center justify-center mb-6">
              <CheckCircle size={32} className="text-[#C9A96E]" />
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-[#2C2C2C] mb-4">
              Děkujeme!
            </h2>
            <p className="text-[#2C2C2C]/70 leading-relaxed">
              Vaši poptávku jsme přijali. <strong>Do 48 hodin</strong> vám pošleme
              osobní výběr svatebních míst přímo na e-mail.
            </p>
          </motion.div>
        ) : (
          <>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-14"
            >
              <p className="text-[#C9A96E] text-xs font-semibold tracking-[.3em] uppercase mb-7">
                Hlavní CTA
              </p>
              <h2 className="font-serif font-light text-4xl md:text-5xl lg:text-6xl leading-[1.05] mb-6 text-[#2C2C2C] max-w-3xl">
                Vyplňte jeden formulář. <span className="italic">Zbytek odpracujeme za vás.</span>
              </h2>
              <p className="text-[#2C2C2C]/70 text-lg leading-relaxed max-w-2xl font-light">
                Formulář je navržený tak, aby nám dal dostatek informací pro přesné doporučení,
                ale vám zabral jen pár minut.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-12 gap-6">
              {/* LEVÁ — Co dostanete */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="lg:col-span-4 space-y-4"
              >
                <div className="bg-white border border-[#E8DDD0] rounded-3xl p-7">
                  <h3 className="font-medium text-[#2C2C2C] mb-5 text-sm">Co od nás dostanete</h3>
                  <ul className="space-y-3 text-sm text-[#2C2C2C]/75 leading-relaxed">
                    <li className="flex gap-2">
                      <span className="text-[#C9A96E] mt-1">•</span>
                      výběr míst podle vašich priorit, ne podle reklamy
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#C9A96E] mt-1">•</span>
                      reálnější představu o cenách a provozních podmínkách
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#C9A96E] mt-1">•</span>
                      možnost doplnit ověřené dodavatele podle typu svatby
                    </li>
                  </ul>
                </div>

                <div className="bg-[#2C2017] text-white rounded-3xl p-7">
                  <p className="text-[#C9A96E] text-[10px] font-semibold tracking-[.3em] uppercase mb-3">
                    Standard služby
                  </p>
                  <h3 className="font-serif text-2xl font-light mb-3">
                    Odpověď do 48 hodin
                  </h3>
                  <p className="text-white/65 text-sm leading-relaxed">
                    Ruční vyhodnocení, osobní přístup a žádné automatické rozesílání
                    do neznámých míst.
                  </p>
                </div>
              </motion.div>

              {/* PRAVÁ — Formulář */}
              <motion.form
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                onSubmit={submit}
                className="lg:col-span-8 bg-white border border-[#E8DDD0] rounded-3xl p-7 md:p-10 shadow-sm"
              >
                {/* Honeypot */}
                <input type="text" tabIndex={-1} autoComplete="off"
                  value={f.honeypot} onChange={set("honeypot")}
                  style={{ position: "absolute", left: "-9999px", opacity: 0 }} aria-hidden="true" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCl}>Termín svatby</label>
                    <input className={inputCl} placeholder="např. červen 2027" value={f.weddingTerm} onChange={set("weddingTerm")} />
                  </div>
                  <div>
                    <label className={labelCl}>Lokalita / kraj / dojezdová vzdálenost</label>
                    <input className={inputCl} placeholder="např. Středočeský kraj do 90 min z Prahy" value={f.location} onChange={set("location")} />
                  </div>

                  <div>
                    <label className={labelCl}>Počet hostů</label>
                    <input className={inputCl} placeholder="např. 80" type="number" value={f.guests} onChange={set("guests")} />
                  </div>
                  <div>
                    <label className={labelCl}>Styl místa</label>
                    <input className={inputCl} placeholder="např. statek, moderní vila, zámeček" value={f.venueStyle} onChange={set("venueStyle")} />
                  </div>

                  <div>
                    <label className={labelCl}>Ubytování</label>
                    <select className={selectCl} value={f.accommodation} onChange={set("accommodation")}>
                      <option value="">Vyberte možnost</option>
                      <option value="primo">Ano — přímo v místě</option>
                      <option value="okoli">Ano — v okolí do 10 minut</option>
                      <option value="neni">Nepotřebujeme</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCl}>Obřad na místě</label>
                    <select className={selectCl} value={f.ceremony} onChange={set("ceremony")}>
                      <option value="">Vyberte možnost</option>
                      <option value="ano">Ano — vše na jednom místě</option>
                      <option value="ne">Ne — pouze hostina a párty</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelCl}>Catering / pití</label>
                    <select className={selectCl} value={f.catering} onChange={set("catering")}>
                      <option value="">Vyberte možnost</option>
                      <option value="vlastni-vse">Vlastní jídlo i pití bez poplatků</option>
                      <option value="vlastni-piti">Vlastní pití bez poplatků</option>
                      <option value="vse-od-mista">Vše od místa</option>
                      <option value="jedno">Je nám to jedno</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCl}>Noční klid / bez omezení</label>
                    <select className={selectCl} value={f.nightCurfew} onChange={set("nightCurfew")}>
                      <option value="">Vyberte možnost</option>
                      <option value="no_curfew">Velká party — bez nočního klidu</option>
                      <option value="indoor_after_22">Pohodová party</option>
                      <option value="do_22">Do 22:00 a pak spát</option>
                      <option value="jedno">Je nám to jedno</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelCl}>Rozpočet na pronájem</label>
                    <input className={inputCl} placeholder="např. do 120 000 Kč" value={f.rentalBudget} onChange={set("rentalBudget")} />
                  </div>
                  <div>
                    <label className={labelCl}>Rozpočet na celou svatbu</label>
                    <input className={inputCl} placeholder="např. do 500 000 Kč" value={f.weddingBudget} onChange={set("weddingBudget")} />
                  </div>
                </div>

                <div className="mt-5">
                  <label className={labelCl}>Speciální požadavky</label>
                  <textarea
                    rows={3}
                    className={`${inputCl} resize-none`}
                    placeholder="např. možnost víkendového pronájmu, brunch druhý den, pet-friendly areál, bezbariérový přístup"
                    value={f.specialRequests}
                    onChange={set("specialRequests")}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                  <div>
                    <label className={labelCl}>Jméno a příjmení</label>
                    <input className={inputCl} placeholder="Vaše jméno" value={f.name} onChange={set("name")} />
                  </div>
                  <div>
                    <label className={labelCl}>E-mail</label>
                    <input className={inputCl} type="email" placeholder="vas@email.cz" value={f.email} onChange={set("email")} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCl}>Telefon</label>
                    <input className={inputCl} type="tel" placeholder="+420 123 456 789" value={f.phone} onChange={set("phone")} />
                  </div>
                </div>

                {/* Souhlasy */}
                <div className="mt-6 space-y-2.5">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={f.consent}
                      onChange={(e) => setF((p) => ({ ...p, consent: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 accent-[#C9A96E] cursor-pointer flex-shrink-0"
                    />
                    <span className="text-xs text-[#2C2C2C]/70 leading-relaxed">
                      Souhlasím se zpracováním osobních údajů za účelem zaslání návrhu míst.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={f.notRobot}
                      onChange={(e) => setF((p) => ({ ...p, notRobot: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 accent-[#C9A96E] cursor-pointer flex-shrink-0"
                    />
                    <span className="text-xs text-[#2C2C2C]/70 leading-relaxed">
                      Potvrzuji, že nejsem robot.
                    </span>
                  </label>
                </div>

                {error && (
                  <p className="mt-4 text-red-600 text-sm text-center p-3 bg-red-50 rounded-xl border border-red-200">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-7 w-full bg-[#C9A96E] text-white font-medium py-4 rounded-full hover:bg-[#A88240] disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-base shadow-lg shadow-[#C9A96E]/25"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {loading ? "Odesílám..." : "Vyplnit a získat svatební místo na míru zdarma"}
                </button>
              </motion.form>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
