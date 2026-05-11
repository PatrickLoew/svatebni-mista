"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, CheckCircle, Send, Sparkles, Heart } from "lucide-react"
import type { WizardAnswers, Match } from "@/lib/matching"
import { REGIONS } from "@/lib/utils"
import type { Region, NearestCity } from "@/lib/types"
import VenueCard from "@/components/venues/VenueCard"
import WizardLoading from "./WizardLoading"
import ConsultationButton from "@/components/consultation/ConsultationButton"
import { validateEmail, validatePhone, validateName } from "@/lib/validation"

const empty: WizardAnswers = {
  season: "leto",
  weddingYear: 2027,
  guests: 80,
  regions: [],
  nearestCity: undefined,
  archType: "jedno",
  accommodation: "primo",
  weddingMode: "komplet",
  catering: "jedno",
  party: "pohoda",
  rentalBudget: 100000,
  weddingBudget: 300000,
  specialRequests: "",
  serviceHelp: ["mista"],
  needCoordinator: "uz-mam",
  needDjModerator: "uz-mam",
  needPhotographer: "uz-mam",
  wantOnlineConsultation: false,
  name: "",
  email: "",
  phone: "",
  consentGdpr: false,
  consentNewsletter: false,
}

const TOTAL_STEPS = 7

export default function Wizard() {
  const [step, setStep] = useState(0)
  const [a, setA] = useState<WizardAnswers>(empty)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<{ matches: Match[] } | null>(null)
  const [error, setError] = useState("")

  const update = <K extends keyof WizardAnswers>(k: K, v: WizardAnswers[K]) =>
    setA((p) => ({ ...p, [k]: v }))

  const toggle = <K extends keyof WizardAnswers>(k: K, item: string) => {
    setA((p) => {
      const arr = (p[k] as string[]) ?? []
      return { ...p, [k]: arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item] }
    })
  }

  function canContinue(s: number): boolean {
    if (s === 6) {
      if (validateEmail(a.email) !== "") return false
      if (a.name && validateName(a.name) !== "") return false
      if (a.phone && validatePhone(a.phone, false) !== "") return false
      if (!a.consentGdpr) return false
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
      <div className="mb-10">
        <div className="flex items-center justify-between text-xs text-charcoal/50 mb-3 uppercase tracking-[.2em]">
          <span>Krok {step + 1} / {TOTAL_STEPS}</span>
          <span className={step >= 5 ? "text-[#C9A96E] font-semibold" : ""}>
            {step >= 5 ? "Skoro hotovo!" : `${Math.round(((step + 1) / TOTAL_STEPS) * 100)} %`}
          </span>
        </div>
        <div className="h-1.5 bg-[#E8DDD0] rounded-full overflow-hidden">
          <motion.div
            initial={false}
            animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
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
          {step === 2 && <Step3 a={a} update={update} />}
          {step === 3 && <Step4 a={a} update={update} />}
          {step === 4 && <Step5 a={a} update={update} />}
          {step === 5 && <Step6 a={a} update={update} toggle={toggle} />}
          {step === 6 && <Step7 a={a} update={update} />}
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

        {step < TOTAL_STEPS - 1 ? (
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
            className="bg-[#3E2723] text-white font-medium px-9 py-3.5 rounded-full hover:bg-[#1F1310] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg"
          >
            <Send size={16} />
            Získat můj návrh
          </button>
        )}
      </div>
    </div>
  )
}

const stepHead = (eyebrow: string, title: React.ReactNode, desc?: string) => (
  <div className="mb-8">
    <p className="text-[#C9A96E] text-xs font-medium tracking-[.3em] uppercase mb-3">{eyebrow}</p>
    <h2 className="font-serif text-3xl md:text-4xl font-light leading-tight mb-3">{title}</h2>
    {desc && <p className="text-charcoal/70 leading-relaxed">{desc}</p>}
  </div>
)

const inputCl = "w-full bg-white border-2 border-[#E8DDD0] rounded-xl px-4 py-3.5 text-base text-[#2C2C2C] focus:outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition"
const labelCl = "block text-sm font-semibold text-[#2C2C2C] mb-3"

function RadioGrid<T extends string | number>({
  value, onChange, options, columns = 1,
}: {
  value: T
  onChange: (v: T) => void
  options: { id: T; label: string; sub?: string }[]
  columns?: 1 | 2 | 3
}) {
  const cols = columns === 1 ? "grid-cols-1" : columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-3"
  return (
    <div className={`grid ${cols} gap-2`}>
      {options.map((o) => {
        const on = value === o.id
        return (
          <button
            key={String(o.id)}
            type="button"
            onClick={() => onChange(o.id)}
            className={`text-left px-4 py-3.5 rounded-xl border-2 transition-all ${
              on ? "bg-[#3E2723] text-white border-[#3E2723]" : "bg-white text-[#2C2C2C] border-[#E8DDD0] hover:border-[#C9A96E]"
            }`}
          >
            <div className="font-medium text-sm">{o.label}</div>
            {o.sub && <div className={`text-xs mt-0.5 ${on ? "text-white/70" : "text-[#2C2C2C]/50"}`}>{o.sub}</div>}
          </button>
        )
      })}
    </div>
  )
}

/* ───────── STEPS ───────── */

function Step1({ a, update }: { a: WizardAnswers; update: <K extends keyof WizardAnswers>(k: K, v: WizardAnswers[K]) => void }) {
  return (
    <>
      {stepHead("Termín svatby", <>Kdy se chcete <em className="text-[#3E2723]">vdávat?</em></>,
        "Stačí roční období — konkrétní den řešit nemusíte.")}

      <div className="mb-7">
        <label className={labelCl}>Termín svatby *</label>
        <RadioGrid
          value={a.season}
          onChange={(v) => update("season", v)}
          columns={2}
          options={[
            { id: "leto", label: "Léto", sub: "červen – srpen" },
            { id: "podzim", label: "Podzim", sub: "září – listopad" },
            { id: "jaro", label: "Jaro", sub: "duben – květen" },
            { id: "jedno", label: "Je nám to jedno", sub: "hlavně místo" },
          ]}
        />
      </div>

      <div className="mb-7">
        <label className={labelCl}>Jaký rok? *</label>
        <RadioGrid
          value={a.weddingYear}
          onChange={(v) => update("weddingYear", v)}
          columns={3}
          options={[
            { id: 2026, label: "2026" },
            { id: 2027, label: "2027" },
            { id: 2028, label: "2028" },
          ]}
        />
      </div>

      <div>
        <label className={labelCl}>
          Počet hostů: <strong className="text-[#3E2723]">{a.guests}</strong>
        </label>
        <input
          type="range" min={20} max={300} step={10}
          value={a.guests}
          onChange={(e) => update("guests", Number(e.target.value))}
          className="w-full accent-[#C9A96E] h-2"
        />
        <div className="flex justify-between text-xs text-charcoal/40 mt-1">
          <span>20</span><span>150</span><span>300+</span>
        </div>
      </div>
    </>
  )
}

function Step2({ a, toggle, update }: {
  a: WizardAnswers
  toggle: <K extends keyof WizardAnswers>(k: K, item: string) => void
  update: <K extends keyof WizardAnswers>(k: K, v: WizardAnswers[K]) => void
}) {
  return (
    <>
      {stepHead("Lokalita", <>Kde si svatbu <em className="text-[#3E2723]">představujete?</em></>,
        "Pomůže nám to najít místa s nejlepší dostupností.")}

      <div className="mb-7">
        <label className={labelCl}>Lokalita do 90 minut *</label>
        <RadioGrid
          value={a.nearestCity ?? "jedno"}
          onChange={(v) => update("nearestCity", v as NearestCity | "jedno")}
          columns={3}
          options={[
            { id: "Praha", label: "od Prahy" },
            { id: "Brno", label: "od Brna" },
            { id: "Ostrava", label: "od Ostravy" },
            { id: "Plzeň", label: "od Plzně" },
            { id: "Hradec Králové", label: "od Hradce Králové" },
            { id: "Liberec", label: "od Liberce" },
            { id: "Olomouc", label: "od Olomouce" },
            { id: "České Budějovice", label: "od Č. Budějovic" },
            { id: "jedno", label: "Je nám to jedno" },
          ]}
        />
      </div>

      <div>
        <label className={labelCl}>
          Preferovaný kraj <span className="font-normal text-charcoal/40">(volitelné, multi-výběr)</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {REGIONS.map((r) => {
            const on = a.regions.includes(r as Region)
            return (
              <button
                key={r}
                type="button"
                onClick={() => toggle("regions", r)}
                className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium border-2 transition-all ${
                  on ? "bg-[#C9A96E] text-white border-[#C9A96E]" : "bg-white text-charcoal border-[#E8DDD0] hover:border-[#C9A96E]"
                }`}
              >
                {r}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

function Step3({ a, update }: { a: WizardAnswers; update: <K extends keyof WizardAnswers>(k: K, v: WizardAnswers[K]) => void }) {
  return (
    <>
      {stepHead("Typ místa", <>Jaký <em className="text-[#3E2723]">prostor</em> hledáte?</>,
        "Vyberte ten, který nejvíc odpovídá vaší vizi.")}

      <div className="mb-7">
        <label className={labelCl}>Architektonický typ místa *</label>
        <RadioGrid
          value={a.archType}
          onChange={(v) => update("archType", v)}
          columns={2}
          options={[
            { id: "priroda", label: "Příroda", sub: "louka, les, u vody" },
            { id: "unikat", label: "Zajímavé místo", sub: "unikát, originál" },
            { id: "hotelovy", label: "Hotelový styl", sub: "komfort a servis" },
            { id: "mlyn", label: "Mlýn / stodola / statek", sub: "rustikální" },
            { id: "industrial", label: "Industriál", sub: "hala, továrna, loft" },
            { id: "hrad", label: "Hrad", sub: "historické zdi" },
            { id: "zamek", label: "Zámek", sub: "elegance, tradice" },
            { id: "jedno", label: "Je nám to jedno", sub: "hlavně atmosféra" },
          ]}
        />
      </div>

      <div>
        <label className={labelCl}>Způsob svatby *</label>
        <RadioGrid
          value={a.weddingMode}
          onChange={(v) => update("weddingMode", v)}
          columns={1}
          options={[
            { id: "komplet", label: "Komplet vše na jednom místě", sub: "obřad, hostina, ubytování, party" },
            { id: "obrad-hostina", label: "Pouze obřad a hostina" },
            { id: "obrad-party", label: "Místo jen na hostinu a party" },
            { id: "obrad", label: "Pouze obřad" },
          ]}
        />
      </div>
    </>
  )
}

function Step4({ a, update }: { a: WizardAnswers; update: <K extends keyof WizardAnswers>(k: K, v: WizardAnswers[K]) => void }) {
  return (
    <>
      {stepHead("Ubytování & catering", <>Co od místa <em className="text-[#3E2723]">potřebujete?</em></>)}

      <div className="mb-7">
        <label className={labelCl}>Ubytování *</label>
        <RadioGrid
          value={a.accommodation}
          onChange={(v) => update("accommodation", v)}
          columns={1}
          options={[
            { id: "primo", label: "Ano — přímo v místě" },
            { id: "okoli", label: "Ano — stačí v okolí do 10 minut" },
            { id: "neni", label: "Ubytování nepotřebujeme" },
          ]}
        />
      </div>

      <div>
        <label className={labelCl}>Catering a pití *</label>
        <RadioGrid
          value={a.catering}
          onChange={(v) => update("catering", v)}
          columns={1}
          options={[
            { id: "vlastni-vse", label: "Vlastní jídlo i pití bez poplatků" },
            { id: "vse-od-mista", label: "Vše chceme zajistit od místa" },
            { id: "vlastni-piti", label: "Chceme jen vlastní pití bez poplatků" },
            { id: "jedno", label: "Je nám to jedno" },
          ]}
        />
      </div>
    </>
  )
}

function Step5({ a, update }: { a: WizardAnswers; update: <K extends keyof WizardAnswers>(k: K, v: WizardAnswers[K]) => void }) {
  return (
    <>
      {stepHead("Party & rozpočet", <>Jak silnou <em className="text-[#3E2723]">párty</em> plánujete?</>)}

      <div className="mb-7">
        <label className={labelCl}>Večerní party *</label>
        <RadioGrid
          value={a.party}
          onChange={(v) => update("party", v)}
          columns={1}
          options={[
            { id: "velka-bez-klidu", label: "Velká party bez nočního klidu", sub: "tancujeme až do rána" },
            { id: "pohoda", label: "Pohodová party", sub: "nejsme pařící typy" },
            { id: "do-22", label: "Do 22:00 a pak spát" },
            { id: "jedno", label: "Je nám to jedno" },
          ]}
        />
      </div>

      <div className="mb-7">
        <label className={labelCl}>Rozpočet na pronájem místa *</label>
        <RadioGrid
          value={a.rentalBudget}
          onChange={(v) => update("rentalBudget", v)}
          columns={2}
          options={[
            { id: 50000, label: "do 50 000 Kč" },
            { id: 70000, label: "do 70 000 Kč" },
            { id: 100000, label: "do 100 000 Kč" },
            { id: 150000, label: "do 150 000 Kč" },
            { id: 200000, label: "do 200 000 Kč" },
            { id: 300000, label: "nad 200 000 Kč" },
            { id: 0, label: "Je nám to jedno" },
          ]}
        />
      </div>

      <div>
        <label className={labelCl}>Rozpočet na celou svatbu</label>
        <RadioGrid
          value={a.weddingBudget}
          onChange={(v) => update("weddingBudget", v)}
          columns={2}
          options={[
            { id: 100000, label: "do 100 000 Kč" },
            { id: 200000, label: "do 200 000 Kč" },
            { id: 300000, label: "do 300 000 Kč" },
            { id: 500000, label: "do 500 000 Kč" },
            { id: 800000, label: "nad 500 000 Kč" },
            { id: 0, label: "Je nám to jedno" },
          ]}
        />
      </div>
    </>
  )
}

function Step6({ a, update, toggle }: {
  a: WizardAnswers
  update: <K extends keyof WizardAnswers>(k: K, v: WizardAnswers[K]) => void
  toggle: <K extends keyof WizardAnswers>(k: K, item: string) => void
}) {
  return (
    <>
      {stepHead("Speciální požadavky", <>Co vám <em className="text-[#3E2723]">leží na srdci?</em></>)}

      <div className="mb-7">
        <label className={labelCl}>Speciální požadavky <span className="font-normal text-charcoal/40">(volitelné)</span></label>
        <textarea
          rows={3}
          className={`${inputCl} resize-none`}
          placeholder="Např.: psi, děti, wellness, bezlepkové menu, bezbariérovost, zákaz hlučné hudby…"
          value={a.specialRequests}
          onChange={(e) => update("specialRequests", e.target.value)}
        />
      </div>

      <div className="mb-7">
        <label className={labelCl}>S čím vám můžeme pomoci? <span className="font-normal text-charcoal/40">(více možností)</span></label>
        <div className="space-y-2">
          {[
            { id: "mista", label: "Doporučit svatební místa" },
            { id: "dodavatele", label: "Doporučit dodavatele (catering, květiny…)" },
            { id: "vse", label: "Pomoc s celým plánováním" },
          ].map((o) => {
            const on = a.serviceHelp.includes(o.id as "mista" | "dodavatele" | "vse")
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => toggle("serviceHelp", o.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                  on ? "bg-[#C9A96E] text-white border-[#C9A96E]" : "bg-white text-[#2C2C2C] border-[#E8DDD0] hover:border-[#C9A96E]"
                }`}
              >
                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${on ? "bg-white border-white" : "border-[#C9A96E]"}`}>
                  {on && <CheckCircle size={11} className="text-[#C9A96E]" />}
                </span>
                <span className="text-sm font-medium">{o.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className={labelCl}>Hledáte koordinátorku? *</label>
          <RadioGrid
            value={a.needCoordinator}
            onChange={(v) => update("needCoordinator", v)}
            columns={3}
            options={[
              { id: "ano", label: "Ano, potřebujeme" },
              { id: "uz-mam", label: "Už máme" },
              { id: "ne", label: "Nechceme" },
            ]}
          />
        </div>

        <div>
          <label className={labelCl}>Hledáte DJ a moderátora? *</label>
          <RadioGrid
            value={a.needDjModerator}
            onChange={(v) => update("needDjModerator", v)}
            columns={3}
            options={[
              { id: "ano", label: "Ano, top za top cenu" },
              { id: "uz-mam", label: "Už máme" },
              { id: "ne", label: "Zatím ne" },
            ]}
          />
        </div>

        <div>
          <label className={labelCl}>Hledáte fotografa nebo kameramana? *</label>
          <RadioGrid
            value={a.needPhotographer}
            onChange={(v) => update("needPhotographer", v)}
            columns={3}
            options={[
              { id: "ano", label: "Ano, top za top cenu" },
              { id: "uz-mam", label: "Už máme" },
              { id: "ne", label: "Nechceme" },
            ]}
          />
        </div>
      </div>

      <div className="mt-7 bg-[#F9F2E6] border-2 border-[#C9A96E]/30 rounded-2xl p-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={a.wantOnlineConsultation}
            onChange={(e) => update("wantOnlineConsultation", e.target.checked)}
            className="mt-1 w-5 h-5 accent-[#C9A96E] cursor-pointer flex-shrink-0"
          />
          <div>
            <div className="font-semibold text-[#2C2C2C] text-sm mb-1">
              Chci online konzultaci ZDARMA
            </div>
            <div className="text-xs text-[#2C2C2C]/70 leading-relaxed">
              Nevíte si rady s výběrem místa? V rámci věrnostního programu se vám
              osobně ozveme a pomůžeme vám projít vše krok za krokem.
            </div>
          </div>
        </label>
      </div>
    </>
  )
}

function Step7({ a, update }: { a: WizardAnswers; update: <K extends keyof WizardAnswers>(k: K, v: WizardAnswers[K]) => void }) {
  const emailErr = a.email ? validateEmail(a.email) : ""
  const nameErr = a.name ? validateName(a.name) : ""
  const phoneErr = a.phone ? validatePhone(a.phone, false) : ""
  const errInputCl = "w-full bg-white border-2 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 transition"

  return (
    <>
      {stepHead("Poslední krok", <>Kam máme <em className="text-[#3E2723]">poslat návrh?</em></>,
        "Stačí jen e-mail. Do 24 hodin obdržíte tři místa s odůvodněním.")}

      <input
        type="text" tabIndex={-1} autoComplete="off"
        value={a.honeypot ?? ""}
        onChange={(e) => update("honeypot", e.target.value)}
        style={{ position: "absolute", left: "-9999px", opacity: 0 }}
        aria-hidden="true"
      />

      <div className="space-y-4 mb-6">
        <div>
          <label className={labelCl}>E-mail *</label>
          <input
            className={`${errInputCl} ${emailErr ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-[#E8DDD0] focus:border-[#C9A96E] focus:ring-[#C9A96E]/20"}`}
            type="email" placeholder="vase@email.cz"
            value={a.email} onChange={(e) => update("email", e.target.value)} autoFocus
          />
          {emailErr && <p className="mt-1.5 text-xs text-red-600">{emailErr}</p>}
        </div>

        <div>
          <label className={labelCl}>Jméno a příjmení <span className="font-normal text-charcoal/40">(volitelné)</span></label>
          <input
            className={`${errInputCl} ${nameErr ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-[#E8DDD0] focus:border-[#C9A96E] focus:ring-[#C9A96E]/20"}`}
            placeholder="Jana Nováková"
            value={a.name} onChange={(e) => update("name", e.target.value)}
          />
          {nameErr && <p className="mt-1.5 text-xs text-red-600">{nameErr}</p>}
        </div>

        <div>
          <label className={labelCl}>Telefon <span className="font-normal text-charcoal/40">(volitelné)</span></label>
          <input
            className={`${errInputCl} ${phoneErr ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-[#E8DDD0] focus:border-[#C9A96E] focus:ring-[#C9A96E]/20"}`}
            type="tel" placeholder="+420 722 123 456"
            value={a.phone} onChange={(e) => update("phone", e.target.value)}
          />
          {phoneErr && <p className="mt-1.5 text-xs text-red-600">{phoneErr}</p>}
        </div>
      </div>

      <label className="flex items-start gap-3 mb-3 p-4 bg-[#F9F2E6] rounded-xl border-2 border-[#C9A96E]/30 cursor-pointer hover:border-[#C9A96E] transition-colors">
        <input
          type="checkbox" checked={a.consentGdpr}
          onChange={(e) => update("consentGdpr", e.target.checked)}
          className="mt-0.5 w-5 h-5 accent-[#C9A96E] cursor-pointer flex-shrink-0"
        />
        <div>
          <span className="block text-sm font-semibold text-[#2C2C2C]">Souhlas se zpracováním údajů *</span>
          <span className="block text-xs text-[#2C2C2C]/70 mt-0.5">
            Souhlasím se zpracováním osobních údajů za účelem zaslání návrhu míst.
          </span>
        </div>
      </label>

      <label className="flex items-start gap-3 mb-3 p-4 bg-white rounded-xl border-2 border-[#E8DDD0] cursor-pointer hover:border-[#C9A96E] transition-colors">
        <input
          type="checkbox" checked={a.consentNewsletter}
          onChange={(e) => update("consentNewsletter", e.target.checked)}
          className="mt-0.5 w-5 h-5 accent-[#C9A96E] cursor-pointer flex-shrink-0"
        />
        <div>
          <span className="block text-sm font-semibold text-[#2C2C2C]">Odebírat novinky a slevy</span>
          <span className="block text-xs text-[#2C2C2C]/70 mt-0.5">
            Slevy na svatby, tipy a inspirace. Odhlásit se můžete kdykoliv.
          </span>
        </div>
      </label>

      <label className="flex items-start gap-3 mb-3 p-4 bg-white rounded-xl border-2 border-[#E8DDD0] cursor-pointer hover:border-[#C9A96E] transition-colors">
        <input
          type="checkbox" checked={a.notRobot ?? false}
          onChange={(e) => update("notRobot", e.target.checked)}
          className="mt-0.5 w-5 h-5 accent-[#C9A96E] cursor-pointer flex-shrink-0"
        />
        <div>
          <span className="block text-sm font-semibold text-[#2C2C2C]">Nejsem robot *</span>
          <span className="block text-xs text-[#2C2C2C]/70 mt-0.5">Potvrzuji, že jsem člověk.</span>
        </div>
      </label>

      <div className="mt-6 bg-gradient-to-r from-[#3E2723] to-[#1F1310] text-white rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-[#C9A96E]/30 flex items-center justify-center flex-shrink-0">
          <Heart size={16} className="text-[#E8C98A]" fill="#E8C98A" />
        </div>
        <div>
          <p className="font-medium text-white text-sm mb-1">
            <strong className="text-[#E8C98A]">Jediná služba v ČR</strong>, která vám podle vašich kritérií vyhodnotí to nejlepší svatební místo
          </p>
          <p className="text-white/70 text-xs leading-relaxed">
            Žádný spam, jen tři osobní doporučení do 24 hodin.
          </p>
        </div>
      </div>
    </>
  )
}

/* ───────── RESULT ───────── */

function ResultScreen({ matches, answers }: { matches: Match[]; answers: WizardAnswers }) {
  const seasonLabel = ({
    leto: "léto", podzim: "podzim", jaro: "jaro", jedno: "kdykoliv", jine: "jiný termín",
  })[answers.season]

  if (matches.length === 0) return <NoMatchScreen name={answers.name} />

  return (
    <div className="max-w-5xl mx-auto px-6 pt-32 pb-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-12"
      >
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="inline-flex w-16 h-16 rounded-full bg-[#C9A96E]/15 items-center justify-center mb-5"
        >
          <CheckCircle size={32} className="text-[#C9A96E]" />
        </motion.div>
        <h1 className="font-serif font-light text-4xl md:text-5xl mb-4">
          Děkujeme{answers.name ? `, ${answers.name.split(" ")[0]}` : ""}!
        </h1>
        <p className="text-charcoal/70 max-w-2xl mx-auto leading-relaxed">
          Pro <strong>{seasonLabel} {answers.weddingYear || ""}</strong>, <strong>{answers.guests} hostů</strong>{" "}
          a rozpočet pronájmu <strong>do {answers.rentalBudget.toLocaleString("cs-CZ")} Kč</strong>{" "}
          jsme vybrali tato místa. Návrh jsme poslali na <strong>{answers.email}</strong>.
        </p>
      </motion.div>

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
            {m.venue.isFeatured && (
              <div className="absolute -top-3 left-3 z-10 bg-gradient-to-r from-[#A88240] via-[#C9A96E] to-[#E8C98A] text-white text-[10px] font-bold tracking-wider px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5L18.2 22 12 17.4 5.8 22l2.4-8.1L2 9.4h7.6z"/></svg>
                DOPORUČUJEME
              </div>
            )}
            <VenueCard venue={m.venue} index={i} />
            {m.personalDescription && (
              <p className="text-sm text-charcoal/70 mt-3 px-2 leading-relaxed">
                {m.personalDescription}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Cashback banner */}
      <div className="bg-gradient-to-r from-[#C9A96E]/15 via-[#E8C98A]/15 to-[#C9A96E]/15 border-2 border-[#C9A96E]/30 rounded-3xl p-7 sm:p-9 text-center mb-6">
        <div className="flex items-center justify-center gap-2 text-[#A88240] text-xs font-semibold tracking-[.25em] uppercase mb-3">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5L18.2 22 12 17.4 5.8 22l2.4-8.1L2 9.4h7.6z"/></svg>
          Bonus pro vás
        </div>
        <p className="font-serif text-2xl md:text-3xl font-light text-[#3E2723] mb-3">
          Cashback <em className="text-[#A88240]">1 000 – 10 000 Kč</em>
        </p>
        <p className="text-charcoal/70 leading-relaxed max-w-xl mx-auto text-sm">
          Pokud si nakonec vyberete některé z míst, která jsme Vám doporučili, a dáte nám vědět, můžeme Vám u vybraných míst zajistit <strong>cashback ve výši 1 000 až 10 000 Kč</strong>.
        </p>
      </div>

      {/* Konzultace CTA */}
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
            Probereme vybraná místa, dostupnost termínů a přesný rozpočet.
          </p>
          <ConsultationButton
            label="Domluvit individuální konzultaci"
            variant="primary"
            size="lg"
            source="wizard-result"
          />
        </div>
      </div>
    </div>
  )
}

function NoMatchScreen({ name }: { name: string }) {
  const firstName = name.split(" ")[0]
  return (
    <div className="max-w-3xl mx-auto px-6 pt-32 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-[#3E2723] to-[#1F1310] rounded-3xl p-8 sm:p-12 text-center mb-10 overflow-hidden"
      >
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#C9A96E]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-[#E8C98A]/15 border border-[#E8C98A]/30 px-4 py-1.5 rounded-full mb-6">
            <span className="text-[#E8C98A] text-[11px] font-semibold tracking-[.25em] uppercase">
              Vaše vize si zaslouží osobní přístup
            </span>
          </div>
          <h2 className="font-serif font-light text-3xl sm:text-4xl text-white leading-tight mb-5">
            {firstName ? `${firstName}, ` : ""}máme pro vás <em className="text-[#E8C98A]">jedinečný plán</em>
          </h2>
          <p className="text-white/80 leading-relaxed max-w-xl mx-auto mb-8 text-base sm:text-lg font-light">
            Naše analýza ukazuje, že vaše představa je výjimečná a zaslouží si ruční výběr.
            Náš specialista s vámi probere detaily a do 24 hodin vám pošle osobní návrh.
          </p>
          <ConsultationButton
            label="Domluvit konzultaci"
            variant="primary"
            size="lg"
            source="wizard-no-match"
          />
        </div>
      </motion.div>
    </div>
  )
}
