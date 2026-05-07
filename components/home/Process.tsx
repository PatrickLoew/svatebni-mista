"use client"

import { motion } from "framer-motion"

const steps = [
  {
    num: "01",
    title: "Vyplníte formulář",
    desc: "Zadáte termín, lokalitu, počet hostů, styl místa, rozpočet a další praktické požadavky.",
  },
  {
    num: "02",
    title: "Požadavky ručně vyhodnotíme",
    desc: "Neprobíhá automatické filtrování. Výběr skládáme ručně podle toho, co pro vás bude opravdu fungovat.",
  },
  {
    num: "03",
    title: "Do 48 hodin dostanete doporučení",
    desc: "Pošleme výběr vhodných míst a podle potřeby i relevantních dodavatelů pro váš formát svatby.",
  },
  {
    num: "04",
    title: "Šetříte čas i slepé poptávky",
    desc: "Získáte konkrétní informace včetně orientačních cen a reálných podmínek bez desítek telefonátů a e-mailů.",
  },
]

const stats = [
  { num: "30 000", label: "sledujících napříč kanály" },
  { num: "1,2 mil.", label: "měsíční dosah značky" },
  { num: "56", label: "poptávek denně" },
  { num: "500+", label: "analyzovaných svatebních míst" },
]

export default function Process() {
  return (
    <section id="process" className="bg-[#F9F2E6]">
      {/* Stats grid + dark commentary card */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-20 md:pt-24 pb-16">
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-6 md:p-7"
              >
                <div className="font-serif text-3xl md:text-4xl font-light text-[#2C2C2C] mb-2">{s.num}</div>
                <div className="text-xs sm:text-sm text-[#2C2C2C]/60 leading-snug">{s.label}</div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-[#2C2017] text-white rounded-2xl p-7 md:p-8"
          >
            <p className="text-white/85 text-sm md:text-base leading-relaxed mb-4">
              Známe orientační ceny, skrytá omezení i rozdíl mezi místem, které dobře vypadá
              na internetu, a místem, které opravdu funguje pro konkrétní typ svatby.
            </p>
            <p className="text-white/75 text-sm md:text-base leading-relaxed">
              Proto jsme se rozhodli nejít cestou dalšího katalogu, ale služby, která párům
              přináší konkrétní doporučení, podmínky a cenovou orientaci.
            </p>
          </motion.div>
        </div>
      </div>

      {/* JAK TO FUNGUJE - 4 steps */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-12 pb-24 md:pb-32">
        <p className="text-[#C9A96E] text-xs font-semibold tracking-[.3em] uppercase mb-7">
          Jak to funguje
        </p>
        <h2 className="font-serif font-light text-4xl md:text-5xl lg:text-6xl leading-[1.05] mb-14 text-[#2C2C2C] max-w-3xl">
          Čtyři kroky, které zkrátí týdny hledání na několik minut.
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="bg-white rounded-2xl p-6 md:p-7"
            >
              <div className="text-[#C9A96E] text-xs font-semibold tracking-[.3em] mb-5">{s.num}</div>
              <h3 className="font-serif text-xl md:text-2xl font-light text-[#2C2C2C] leading-tight mb-4">
                {s.title}
              </h3>
              <p className="text-sm text-[#2C2C2C]/65 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
