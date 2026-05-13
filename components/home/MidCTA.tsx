"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

export default function MidCTA() {
  return (
    <section className="relative py-24 px-6 bg-[#F9F2E6] overflow-hidden">
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-[#C9A96E]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-[#3E2723]/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative max-w-4xl mx-auto text-center"
      >
        <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md border border-[#C9A96E]/30 px-4 py-2 rounded-full text-xs font-semibold tracking-[.15em] uppercase text-[#3E2723] mb-7">
          <Sparkles size={13} className="text-[#C9A96E]" />
          Jediná služba v ČR
        </div>

        <h2 className="font-serif font-light text-4xl md:text-6xl leading-[1.05] mb-6">
          Vyhodnotíme pro vás <em className="text-[#3E2723]">nejlepší místo</em>
        </h2>
        <p className="text-charcoal/70 max-w-2xl mx-auto leading-relaxed text-lg font-light mb-10">
          Šest otázek vám zabere 5 minut. Naše analýza projde stovky míst
          a podle <strong>vašich kritérií</strong> vyhodnotí <strong>5 nejlepších svatebních míst</strong>.
          Návrh do 24 hodin, zcela zdarma.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/chci-svatbu"
            className="group bg-[#3E2723] text-white font-medium px-9 py-4 rounded-full hover:bg-[#1F1310] transition-all hover:scale-[1.02] inline-flex items-center justify-center gap-2"
          >
            Spustit analýzu na míru
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <Link
            href="/venues"
            className="bg-white/80 backdrop-blur-md border border-[#E8DDD0] text-charcoal font-medium px-9 py-4 rounded-full hover:bg-white transition-all inline-flex items-center justify-center"
          >
            Raději projít katalog
          </Link>
        </div>

        <div className="flex items-center justify-center gap-8 mt-12 text-xs text-charcoal/50">
          {["6 otázek", "5 minut", "Zdarma", "Bez závazku"].map((b) => (
            <div key={b} className="flex items-center gap-1.5">
              <span className="text-[#C9A96E]">✓</span>
              {b}
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
