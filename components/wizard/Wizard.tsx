"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, CheckCircle, Send, Sparkles, Heart } from "lucide-react"
import type { WizardAnswers, Match } from "@/lib/matching"
import { REGIONS, VENUE_TYPES, NEAREST_CITIES } from "@/lib/utils"
import type { NearestCity } from "@/lib/types"
import VenueCard from "@/components/venues/VenueCard"
import WizardLoading from "./WizardLoading"
import ConsultationButton from "@/components/consultation/ConsultationButton"
import { validateEmail, validatePhone, validateName } from "@/lib/validation"

const currentYear = new Date().getFullYear()
const YEARS = [currentYear, currentYear + 1, currentYear + 2, currentYear + 3]
const MONTHS = [
  { id: 1, label: "Leden", season: "zima" },
  { id: 2, label: "Únor", season: "zima" },
  { id: 3, label: "Březen", season: "jaro" },
  { id: 4, label: "Duben", season: "jaro" },
  { id: 5, label: "Květen", season: "jaro" },
  { id: 6, label: "Červen", season: "léto", popular: true },
  { id: 7, label: "Červenec", season: "léto", popular: true },
  { id: 8, label: "Srpen", season: "léto", popular: true },
  { id: 9, label: "Září", season: "podzim", popular: true },
  { id: 10, label: "Říjen", season: "podzim" },
  { id: 11, label: "Listopad", season: "podzim" },
  { id: 12, label: "Prosinec", season: "zima" },
]

const empty: WizardAnswers = {
  weddingYear: currentYear + 1,
  weddingMonth: 6,
  flexibility: "ten-rok",
  guests: 80,
  budget: 500000,
  regions: [],
  nearestCity: undefined,
  types: [],
  atmosphere: [],
  setting: "both",
  mustHave: [],
  vision: "",
  concerns: "",
  name: "",
  email: "",
  phone: "",
}

const ATMOSPHERES = [
  { id: "intimni", label: "Intimní", desc: "30–60 hostů" },
  { id: "velkolepa", label: "Velkolepá", desc: "100+ hostů" },
  { id: "moderni", label: "Moderní", desc: "Čisté linie" },
  { id: "klasicka", label: "Klasická", desc: "Tradice a elegance" },
  { id: "rustikalni", label: "Rustikální", desc: "Statek, příroda" },
  { id: "luxusni", label: "Luxusní", desc: "Bez kompromisů" },
] as const

const MUST_HAVE = [
  { id: "ubytovani-na-miste", label: "Ubytování přímo na místě" },
  { id: "vlastni-piti", label: "Vlastní pití bez poplatků" },
  { id: "bez-nocniho-klidu", label: "Party bez nočního klidu (do rána)" },
  { id: "venkovni", label: "Venkovní obřad" },
  { id: "wellness", label: "Wellness / sauna" },
  { id: "deti", label: "Místo vhodné s dětmi" },
  { id: "parkovani", label: "Dostatek parkování" },
  { id: "bezbarierovy", label: "Bezbariérový přístup" },
]

export default function Wizard() {
  const [step, setStep] = useState(0)
  const [a, setA] = useState<WizardAnswers>(empty)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<{ matches: Match[] } | null>(null)
  const [error, setError] = useState("")

  const total = 6
  const update = <K extends keyof WizardAnswers>(k: K, v: WizardAnswers[K]) =>
    setA((p) => ({ ...p, [k]: v }))

  const toggle = <K extends keyof WizardAnswers>(k: K, item: string) => {
    setA((p) => {
      const arr = (p[k] as string[]) ?? []
      return { ...p, [k]: arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item] }
    })
  }

  function canContinue(s: number): boolean {
    if (s === 0) return Boolean(a.weddingYear && a.guests > 0 && a.budget > 0)
    if (s === 5) {
      // Email povinný a v platném formátu
      if (validateEmail(a.email) !== "") return false
      // Pokud zadáno jméno, musí být platné
      if (a.name && validateName(a.name) !== "") return false
      // Pokud zadán telefon, musí být platný
      if (a.phone && validatePhone(a.phone, false) !== "") return false
      // Captcha musí být zaškrtnutá
      return Boolean(a.notRobot)
    }
    return true
  }

  async function submit() {
    setLoading(true)
    setError("")
    const minWait = new Promise<void>((r) => setTimeout(r, 4500))
    try {
      const apiCall = fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(a),
      }).then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? "Chyba")
        return json
      })
      const [json] = await Promise.all([apiCall, minWait])
      setDone({ matches: json.matches ?? [] })
    } catch (e) {
      await minWait
      setError(e instanceof Error ? e.message : "Něco se pokazilo")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <WizardLoading />
  if (done) return <ResultScreen matches={done.matches} answers={a} />

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Progress */}
      <div className="mb-10">
        <div className="flex items-center justify-between text-xs text-charcoal/50 mb-3 uppercase tracking-[.2em]">
          <span>Krok {step + 1} / {total}</span>
          <span className={step >= 4 ? "text-[#C9A96E] font-semibold" : ""}>
            {step >= 4 ? "Skoro hotovo!" : `${Math.round(((step + 1) / total) * 100)} %`}
          </span>
        </div>
        <div className="h-1.5 bg-[#E8DDD0] rounded-full overflow-hidden">
          <motion.div
            initial={false}
            animate={{ width: `${((step + 1) / total) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-[#C9A96E] to-[#E8C98A]"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.4 }}
        >
          {step === 0 && <Step1 a={a} update={update} />}
          {step === 1 && <Step2 a={a} toggle={toggle} update={update} />}
          {step === 2 && <Step3 a={a} toggle={toggle} update={update} />}
          {step === 3 && <Step4 a={a} toggle={toggle} />}
          {step === 4 && <Step5 a={a} update={update} />}
          {step === 5 && <Step6 a={a} update={update} />}
        </motion.div>
      </AnimatePresence>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mt-12 pt-8 border-t border-[#E8DDD0]">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex items-center gap-2 text-charcoal/60 hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} /> Zpět
        </button>

        {step < total - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canContinue(step)}
            className="bg-[#C9A96E] text-white font-medium px-7 py-3 rounded-full hover:bg-[#A88240] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-[#C9A96E]/20"
          >
            Pokračovat <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!canContinue(step)}
            className="bg-[#3E2723] text-white font-medium px-9 py-3.5 rounded-full hover:bg-[#1F1310] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-[#3E2723]/30"
          >
            <Send size={16} />
            Získat můj návrh
          </button>
        )}
      </div>

      {/* Trust signals (jen na pozdějších krocích) */}
      {step >= 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 flex items-center justify-center gap-6 text-xs text-charcoal/40"
        >
          <div className="flex items-center gap-1"><span className="text-[#C9A96E]">✓</span> Bez závazku</div>
          <div className="flex items-center gap-1"><span className="text-[#C9A96E]">✓</span> Žádný spam</div>
          <div className="flex items-center gap-1"><span className="text-[#C9A96E]">✓</span> Návrh do 24 hod</div>
        </motion.div>
      )}
    </div>
  )
}

/* ---------- STEPS ---------- */

const stepHead = (eyebrow: string, title: React.ReactNode, desc?: string) => (
  <div className="mb-8">
    <p className="text-[#C9A96E] text-xs font-medium tracking-[.3em] uppercase mb-3">{eyebrow}</p>
    <h2 className="font-serif text-3xl md:text-4xl font-light leading-tight mb-3">{title}</h2>
    {desc && <p className="text-charcoal/60 leading-relaxed">{desc}</p>}
  </div>
)

const inputCl = "w-full bg-white border border-[#E8DDD0] rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition"

function Step1({ a, update }: { a: WizardAnswers; update: <K extends keyof WizardAnswers>(k: K, v: WizardAnswers[K]) => void }) {
  return (
    <>
      {stepHead(
        "Začneme základem",
        <>Kdy se chcete <em className="text-[#3E2723]">vdávat?</em></>,
        "Konkrétní den řešit nemusíte — flexibilita pomáhá najít víc volných míst."
      )}

      {/* Year */}
      <p className="text-sm font-medium text-charcoal/70 mb-3">Rok svatby</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {YEARS.map((y) => {
          const on = a.weddingYear === y
          return (
            <button
              key={y}
              onClick={() => update("weddingYear", y)}
              className={`py-3.5 rounded-xl text-sm font-medium border transition-all ${
                on ? "bg-[#3E2723] text-white border-[#3E2723]" : "bg-white text-charcoal border-[#E8DDD0] hover:border-[#C9A96E]"
              }`}
            >
              {y}
            </button>
          )
        })}
      </div>

      {/* Month */}
      <p className="text-sm font-medium text-charcoal/70 mb-3 flex items-center gap-2">
        Měsíc
        <span className="text-xs font-normal text-charcoal/40">(volitelné)</span>
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
        <button
          onClick={() => update("weddingMonth", 0)}
          className={`py-3 rounded-xl text-sm font-medium border transition-all ${
            a.weddingMonth === 0 ? "bg-[#C9A96E] text-white border-[#C9A96E]" : "bg-white text-charcoal border-[#E8DDD0] hover:border-[#C9A96E]"
          }`}
        >
          Ještě nevím
        </button>
        {MONTHS.map((m) => {
          const on = a.weddingMonth === m.id
          return (
            <button
              key={m.id}
              onClick={() => update("weddingMonth", m.id)}
              className={`relative py-3 rounded-xl text-sm font-medium border transition-all ${
                on ? "bg-[#C9A96E] text-white border-[#C9A96E]" : "bg-white text-charcoal border-[#E8DDD0] hover:border-[#C9A96E]"
              }`}
            >
              {m.label}
              {m.popular && !on && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#3E2723] text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
                  ★
                </span>
              )}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-charcoal/40 mb-7">★ = sezónní oblíbené měsíce, plánujte 12+ měsíců dopředu</p>

      {/* Flexibility */}
      <p className="text-sm font-medium text-charcoal/70 mb-3">Jak jste flexibilní s termínem?</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-7">
        {[
          { id: "presny-mesic", label: "Pevný měsíc", desc: "Trvám na vybraném" },
          { id: "ten-rok", label: "Záleží na roku", desc: "Měsíc můžu posunout" },
          { id: "flexibilni", label: "Plně flexibilní", desc: "Nejdůležitější je místo" },
        ].map((o) => (
          <button
            key={o.id}
            onClick={() => update("flexibility", o.id as "presny-mesic" | "ten-rok" | "flexibilni")}
            className={`px-4 py-3 rounded-xl text-sm font-medium border text-left transition-all ${
              a.flexibility === o.id ? "bg-[#3E2723] text-white border-[#3E2723]" : "bg-white text-charcoal border-[#E8DDD0] hover:border-[#C9A96E]"
            }`}
          >
            <div>{o.label}</div>
            <div className={`text-[10px] mt-0.5 ${a.flexibility === o.id ? "text-white/70" : "text-charcoal/40"}`}>{o.desc}</div>
          </button>
        ))}
      </div>

      {/* Guests slider */}
      <label className="block mb-6">
        <span className="text-sm font-medium text-charcoal/70 mb-2 block">
          Počet hostů: <strong className="text-[#3E2723]">{a.guests}</strong>
        </span>
        <input
          type="range"
          min={20}
          max={300}
          step={10}
          value={a.guests}
          onChange={(e) => update("guests", Number(e.target.value))}
          className="w-full accent-[#C9A96E] h-2"
        />
        <div className="flex justify-between text-xs text-charcoal/40 mt-1">
          <span>20</span><span>150</span><span>300+</span>
        </div>
      </label>

      {/* Budget slider */}
      <label className="block">
        <span className="text-sm font-medium text-charcoal/70 mb-2 block">
          Celkový rozpočet: <strong className="text-[#3E2723]">{new Intl.NumberFormat("cs-CZ").format(a.budget)} Kč</strong>
        </span>
        <input
          type="range"
          min={100000}
          max={2000000}
          step={50000}
          value={a.budget}
          onChange={(e) => update("budget", Number(e.target.value))}
          className="w-full accent-[#C9A96E] h-2"
        />
        <div className="flex justify-between text-xs text-charcoal/40 mt-1">
          <span>100 tis.</span><span>1 mil.</span><span>2 mil. +</span>
        </div>
      </label>
    </>
  )
}

function Step2({ a, toggle, update }: { a: WizardAnswers; toggle: <K extends keyof WizardAnswers>(k: K, item: string) => void; update: <K extends keyof WizardAnswers>(k: K, v: WizardAnswers[K]) => void }) {
  return (
    <>
      {stepHead(
        "Lokalita",
        <>Kde si svatbu <em className="text-[#3E2723]">představujete?</em></>,
        "Pomůže nám to vybrat místa s nejlepší dostupností pro vás i hosty."
      )}

      <p className="text-sm font-medium text-charcoal/70 mb-3">Odkud převážně přijedete vy a hosté?</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-7">
        <button
          onClick={() => update("nearestCity", undefined)}
          className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
            !a.nearestCity ? "bg-[#C9A96E] text-white border-[#C9A96E]" : "bg-white text-charcoal border-[#E8DDD0] hover:border-[#C9A96E]"
          }`}
        >
          Jedno mi to
        </button>
        {NEAREST_CITIES.map((c) => {
          const on = a.nearestCity === c
          return (
            <button
              key={c}
              onClick={() => update("nearestCity", c as NearestCity)}
              className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
                on ? "bg-[#C9A96E] text-white border-[#C9A96E]" : "bg-white text-charcoal border-[#E8DDD0] hover:border-[#C9A96E]"
              }`}
            >
              {c}
            </button>
          )
        })}
      </div>

      <p className="text-sm font-medium text-charcoal/70 mb-3 flex items-center gap-2">
        Preferovaný kraj
        <span className="text-xs font-normal text-charcoal/40">(volitelné, multi-výběr)</span>
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {REGIONS.map((r) => {
          const on = a.regions.includes(r)
          return (
            <button
              key={r}
              onClick={() => toggle("regions", r)}
              className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
                on ? "bg-[#3E2723] text-white border-[#3E2723]" : "bg-white text-charcoal border-[#E8DDD0] hover:border-[#C9A96E]"
              }`}
            >
              {r}
            </button>
          )
        })}
      </div>
    </>
  )
}

function Step3({ a, toggle, update }: { a: WizardAnswers; toggle: <K extends keyof WizardAnswers>(k: K, item: string) => void; update: <K extends keyof WizardAnswers>(k: K, v: WizardAnswers[K]) => void }) {
  return (
    <>
      {stepHead(
        "Typ & atmosféra",
        <>Jaké místo k vám <em className="text-[#3E2723]">promluví?</em></>
      )}

      <p className="text-sm font-medium text-charcoal/70 mb-3">Typ místa</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-7">
        {VENUE_TYPES.map((t) => {
          const on = a.types.includes(t)
          return (
            <button
              key={t}
              onClick={() => toggle("types", t)}
              className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
                on ? "bg-[#C9A96E] text-white border-[#C9A96E]" : "bg-white text-charcoal border-[#E8DDD0] hover:border-[#C9A96E]"
              }`}
            >
              {t}
            </button>
          )
        })}
      </div>

      <p className="text-sm font-medium text-charcoal/70 mb-3">Atmosféra</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-7">
        {ATMOSPHERES.map((at) => {
          const on = a.atmosphere.includes(at.id)
          return (
            <button
              key={at.id}
              onClick={() => toggle("atmosphere", at.id)}
              className={`px-4 py-3 rounded-xl text-sm font-medium border text-left transition-all ${
                on ? "bg-[#C9A96E] text-white border-[#C9A96E]" : "bg-white text-charcoal border-[#E8DDD0] hover:border-[#C9A96E]"
              }`}
            >
              <div>{at.label}</div>
              <div className={`text-[10px] mt-0.5 ${on ? "text-white/70" : "text-charcoal/40"}`}>{at.desc}</div>
            </button>
          )
        })}
      </div>

      <p className="text-sm font-medium text-charcoal/70 mb-3">Obřad</p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { id: "indoor", label: "Uvnitř" },
          { id: "outdoor", label: "Venku" },
          { id: "both", label: "Obojí mi sedne" },
        ].map((o) => (
          <button
            key={o.id}
            onClick={() => update("setting", o.id as "indoor" | "outdoor" | "both")}
            className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
              a.setting === o.id ? "bg-[#3E2723] text-white border-[#3E2723]" : "bg-white text-charcoal border-[#E8DDD0] hover:border-[#C9A96E]"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </>
  )
}

function Step4({ a, toggle }: { a: WizardAnswers; toggle: <K extends keyof WizardAnswers>(k: K, item: string) => void }) {
  return (
    <>
      {stepHead(
        "Co musí mít?",
        <>Vyberte co je pro vás <em className="text-[#3E2723]">nezbytné</em></>,
        "Tyto požadavky budou prioritizovány při výběru. Můžete vynechat."
      )}
      <div className="grid grid-cols-2 gap-2">
        {MUST_HAVE.map((m) => {
          const on = a.mustHave.includes(m.id)
          return (
            <button
              key={m.id}
              onClick={() => toggle("mustHave", m.id)}
              className={`px-4 py-3.5 rounded-xl text-sm font-medium border flex items-center gap-2 transition-all ${
                on ? "bg-[#C9A96E] text-white border-[#C9A96E]" : "bg-white text-charcoal border-[#E8DDD0] hover:border-[#C9A96E]"
              }`}
            >
              <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${on ? "bg-white border-white" : "border-[#C9A96E]"}`}>
                {on && <CheckCircle size={12} className="text-[#C9A96E]" />}
              </span>
              <span className="text-left">{m.label}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}

function Step5({ a, update }: { a: WizardAnswers; update: <K extends keyof WizardAnswers>(k: K, v: WizardAnswers[K]) => void }) {
  return (
    <>
      {stepHead(
        "Vaše vize",
        <>Povězte nám <em className="text-[#3E2723]">víc</em></>,
        "Volitelné, ale čím konkrétnější, tím přesnější návrh dostanete."
      )}
      <div className="space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-charcoal/70 mb-2 block">Jak by měla svatba vypadat?</span>
          <textarea
            rows={4}
            placeholder="Např. Letní zahradní svatba s dlouhým stolem, BBQ a živou kapelou. Hosté se cítí jako doma."
            className={`${inputCl} resize-none`}
            value={a.vision}
            onChange={(e) => update("vision", e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-charcoal/70 mb-2 block">Co je pro vás priorita?</span>
          <textarea
            rows={3}
            placeholder="Např. Pohodlí starších hostů, parkování, doprava z Prahy."
            className={`${inputCl} resize-none`}
            value={a.concerns}
            onChange={(e) => update("concerns", e.target.value)}
          />
        </label>
      </div>
    </>
  )
}

function Step6({ a, update }: { a: WizardAnswers; update: <K extends keyof WizardAnswers>(k: K, v: WizardAnswers[K]) => void }) {
  // Inline validace — chyba se zobrazí jen pokud uživatel pole opustil/začal psát
  const emailErr = a.email ? validateEmail(a.email) : ""
  const nameErr = a.name ? validateName(a.name) : ""
  const phoneErr = a.phone ? validatePhone(a.phone, false) : ""

  const errInputCl = "w-full bg-white border-2 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 transition"

  return (
    <>
      {stepHead(
        "Poslední krok",
        <>Kam vám máme <em className="text-[#3E2723]">poslat návrh?</em></>,
        "Stačí jen e-mail. Do 24 hodin obdržíte 3 nejvíce hodící se místa s odůvodněním a rozpočty. Zdarma."
      )}

      {/* Honeypot — invisible, traps bots */}
      <input
        type="text" tabIndex={-1} autoComplete="off"
        value={a.honeypot ?? ""}
        onChange={(e) => update("honeypot", e.target.value)}
        style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}
        aria-hidden="true"
      />

      <div className="space-y-4">
        {/* E-mail */}
        <div>
          <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">
            Váš e-mail <span className="text-[#C9A96E]">*</span>
          </label>
          <input
            className={`${errInputCl} ${emailErr ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-[#E8DDD0] focus:border-[#C9A96E] focus:ring-[#C9A96E]/20"}`}
            type="email"
            placeholder="napr. jana@email.cz"
            value={a.email}
            onChange={(e) => update("email", e.target.value)}
            autoFocus
          />
          {emailErr && <p className="mt-1.5 text-xs text-red-600">{emailErr}</p>}
        </div>

        {/* Jméno */}
        <div>
          <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">
            Jméno <span className="text-[#2C2C2C]/40 font-normal">(volitelné, pro osobnější oslovení)</span>
          </label>
          <input
            className={`${errInputCl} ${nameErr ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-[#E8DDD0] focus:border-[#C9A96E] focus:ring-[#C9A96E]/20"}`}
            placeholder="Jana Nováková"
            value={a.name}
            onChange={(e) => update("name", e.target.value)}
          />
          {nameErr && <p className="mt-1.5 text-xs text-red-600">{nameErr}</p>}
        </div>

        {/* Telefon */}
        <div>
          <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">
            Telefon <span className="text-[#2C2C2C]/40 font-normal">(volitelné, pro rychlejší kontakt)</span>
          </label>
          <input
            className={`${errInputCl} ${phoneErr ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-[#E8DDD0] focus:border-[#C9A96E] focus:ring-[#C9A96E]/20"}`}
            type="tel"
            placeholder="+420 722 123 456"
            value={a.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
          {phoneErr && <p className="mt-1.5 text-xs text-red-600">{phoneErr}</p>}
        </div>
      </div>

      {/* Captcha — Nejsem robot */}
      <label className="mt-5 flex items-start gap-3 p-4 bg-[#F9F2E6] border-2 border-[#C9A96E]/30 rounded-xl cursor-pointer hover:border-[#C9A96E] transition-colors">
        <input
          type="checkbox"
          checked={a.notRobot ?? false}
          onChange={(e) => update("notRobot", e.target.checked)}
          className="mt-0.5 w-5 h-5 accent-[#C9A96E] cursor-pointer flex-shrink-0"
        />
        <div className="flex-1">
          <span className="block text-sm font-semibold text-[#2C2C2C]">Nejsem robot</span>
          <span className="block text-xs text-[#2C2C2C]/70 mt-0.5">Potvrzuji, že jsem člověk a chci osobní návrh.</span>
        </div>
      </label>

      {/* Trust block */}
      <div className="mt-5 bg-[#F9F2E6] rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-[#C9A96E]/20 flex items-center justify-center flex-shrink-0">
          <Heart size={16} className="text-[#C9A96E]" fill="#C9A96E" />
        </div>
        <div>
          <p className="font-medium text-charcoal text-sm mb-1">
            Už <strong className="text-[#3E2723]">347 párů</strong> dostalo přes nás osobní návrh
          </p>
          <p className="text-charcoal/60 text-xs leading-relaxed">
            E-mail použijeme pouze k zaslání návrhu. Žádný spam, žádné třetí strany.
          </p>
        </div>
      </div>
    </>
  )
}

/* ---------- NO MATCH ---------- */

function NoMatchScreen({ name }: { name: string }) {
  const firstName = name.split(" ")[0]
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-br from-[#3E2723] to-[#1F1310] rounded-3xl p-8 sm:p-12 text-center mb-10 overflow-hidden"
    >
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#C9A96E]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-[#C9A96E]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="inline-flex items-center gap-2 bg-[#E8C98A]/15 border border-[#E8C98A]/30 px-4 py-1.5 rounded-full mb-6">
          <span className="text-[#E8C98A] text-[11px] font-semibold tracking-[.25em] uppercase">
            Vaše vize si zaslouží osobní přístup
          </span>
        </div>

        <h2 className="font-serif font-light text-3xl sm:text-4xl md:text-5xl text-white leading-tight mb-5">
          {firstName ? `${firstName}, ` : ""}máme pro vás <em className="text-[#E8C98A]">jedinečný plán</em>
        </h2>

        <p className="text-white/80 leading-relaxed max-w-2xl mx-auto mb-8 text-base sm:text-lg font-light">
          Vaše představa je výjimečná a zaslouží si ruční výběr — ne jen algoritmus.
          Náš specialista s vámi <strong className="text-white">během 30 minut probere detaily</strong> a
          do 24 hodin vám pošle <strong className="text-white">osobní návrh tří míst</strong>, které přesně sednou.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
          <ConsultationButton
            label="Domluvit konzultaci ihned"
            variant="primary"
            size="lg"
            source="wizard-no-match"
          />
          <a
            href="/venues"
            className="text-[#E8C98A] font-medium px-6 py-3 hover:text-white transition-colors text-sm"
          >
            Nebo si projděte celý katalog →
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/50 pt-6 border-t border-white/10">
          <span>Konzultace zdarma</span>
          <span className="text-[#C9A96E]">•</span>
          <span>Online, telefon nebo osobně</span>
          <span className="text-[#C9A96E]">•</span>
          <span>Odpověď do 24 hodin</span>
        </div>
      </div>
    </motion.div>
  )
}

/* ---------- RESULT ---------- */

function ResultScreen({ matches, answers }: { matches: Match[]; answers: WizardAnswers }) {
  const monthLabel = answers.weddingMonth === 0
    ? "termín ještě upřesníme"
    : `${MONTHS.find((m) => m.id === answers.weddingMonth)?.label} ${answers.weddingYear}`

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="inline-flex w-16 h-16 rounded-full bg-[#C9A96E]/15 items-center justify-center mb-5"
        >
          <CheckCircle size={32} className="text-[#C9A96E]" />
        </motion.div>
        <h1 className="font-serif font-light text-4xl md:text-5xl mb-4">
          Děkujeme, {answers.name.split(" ")[0]}!
        </h1>
        <p className="text-charcoal/70 max-w-2xl mx-auto leading-relaxed">
          Pro <strong>{monthLabel}</strong>, {answers.guests} hostů a rozpočet{" "}
          <strong>{new Intl.NumberFormat("cs-CZ").format(answers.budget)} Kč</strong> jsme vybrali tato 3 místa.
          {" "}Kompletní návrh včetně cenových rozpisů jsme právě poslali na <strong>{answers.email}</strong>.
        </p>
      </motion.div>

      {matches.length > 0 ? (
        <>
          <h2 className="font-serif text-2xl text-center mb-8">
            <Sparkles className="inline-block mb-1 text-[#C9A96E] mr-2" size={20} />
            Náš návrh pro vás
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {matches.map((m, i) => (
              <motion.div
                key={m.venue.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                <div className="absolute -top-3 left-3 z-10 bg-[#3E2723] text-white text-xs px-3 py-1 rounded-full font-medium">
                  {i === 0 ? "✦ Nejlepší shoda" : `Shoda ${m.score} %`}
                </div>
                <VenueCard venue={m.venue} index={i} />
                {m.reasons[0] && (
                  <p className="text-xs text-charcoal/60 mt-3 italic px-2 leading-relaxed">
                    {m.reasons[0]}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <NoMatchScreen name={answers.name} />
      )}

      {/* Consultation upsell */}
      <div className="bg-gradient-to-br from-[#3E2723] to-[#1F1310] rounded-3xl p-10 text-white text-center mb-6 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#C9A96E]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <span className="inline-block bg-[#E8C98A] text-[#3E2723] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mb-5">
            ★ Doporučujeme jako další krok
          </span>
          <p className="font-serif text-3xl md:text-4xl font-light mb-3">
            Chcete jít do <em className="text-[#E8C98A]">hloubky?</em>
          </p>
          <p className="text-white/70 leading-relaxed max-w-xl mx-auto mb-7">
            Domluvte si <strong>30 minut zdarma</strong> s naším specialistou.
            Probereme vybraná místa, dostupnost termínů a přesný rozpočet —
            online, telefonicky nebo osobně.
          </p>
          <ConsultationButton
            label="Domluvit individuální konzultaci"
            variant="primary"
            size="lg"
            source="wizard-result"
          />
        </div>
      </div>

      {/* Secondary action */}
      <div className="text-center bg-[#F9F2E6] rounded-2xl p-7">
        <p className="text-charcoal/70 mb-4">Nebo nejprve projděte celý katalog</p>
        <a
          href="/venues"
          className="inline-block border-2 border-[#3E2723] text-[#3E2723] font-medium px-7 py-3 rounded-full hover:bg-[#3E2723] hover:text-white transition-colors"
        >
          Prohlédnout všechna místa →
        </a>
      </div>
    </div>
  )
}
