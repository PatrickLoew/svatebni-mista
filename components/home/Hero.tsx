"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Check } from "lucide-react"

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-6 md:px-10 bg-gradient-to-br from-[#FEFDFB] via-[#F9F2E6] to-[#F0E8DC] overflow-hidden">
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-[#C9A96E]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#3E2723]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 items-start">
        {/* LEVÁ STRANA — text */}
        <div className="lg:col-span-7">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[#C9A96E] text-xs font-semibold tracking-[.3em] uppercase mb-8"
          >
            Prémiová služba pro snoubence
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="font-serif font-light text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[1.02] tracking-tight mb-8 text-[#2C2C2C]"
          >
            Svatební místo na míru.
            <span className="block italic text-[#3E2723] mt-2">
              Bez obepisování desítek míst.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-[#2C2C2C]/75 text-lg md:text-xl leading-relaxed max-w-2xl mb-8 font-light"
          >
            Vyplníte jeden formulář a do 48 hodin zdarma dostanete výběr vhodných
            svatebních míst podle termínu, lokality, kapacity, stylu, rozpočtu
            a reálných provozních podmínek.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap gap-3 mb-10"
          >
            {["zdarma", "odpověď do 48 hodin", "reálné ceny a podmínky"].map((p) => (
              <span key={p} className="bg-white/70 backdrop-blur-md border border-[#E8DDD0] text-[#2C2C2C]/80 text-xs sm:text-sm px-5 py-2 rounded-full font-medium">
                {p}
              </span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <a
              href="#hlavni-cta"
              className="inline-flex items-center gap-3 bg-[#C9A96E] text-white font-medium px-8 py-5 rounded-full hover:bg-[#A88240] transition-all hover:scale-[1.02] text-base shadow-lg shadow-[#C9A96E]/30"
            >
              Vyplň náš formulář a získej svatební místo na míru zdarma
              <span className="text-lg">→</span>
            </a>
          </motion.div>
        </div>

        {/* PRAVÁ STRANA — karta JAK VYPADÁ VÝSTUP */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="lg:col-span-5"
        >
          <div className="bg-gradient-to-br from-[#F9F2E6] to-[#F0E8DC] border border-[#C9A96E]/20 rounded-3xl p-8 md:p-10 shadow-lg">
            <p className="text-[#C9A96E] text-xs font-semibold tracking-[.3em] uppercase mb-5">
              Jak vypadá výstup
            </p>
            <h3 className="font-serif font-light text-3xl md:text-4xl lg:text-5xl text-[#2C2C2C] leading-[1.05] mb-8">
              Pečlivě vybraný přehled, ne nekonečný katalog
            </h3>

            <div className="space-y-3">
              {[
                "4 až 6 vhodných míst podle vašich priorit",
                "orientační ceny pronájmu a praktické podmínky",
                "doporučení dodavatelů, pokud dávají smysl",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 bg-white rounded-2xl px-5 py-4 border border-[#E8DDD0]">
                  <div className="w-6 h-6 rounded-full bg-[#C9A96E]/20 flex items-center justify-center flex-shrink-0">
                    <Check size={13} className="text-[#3E2723]" />
                  </div>
                  <p className="text-sm text-[#2C2C2C] leading-snug">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
