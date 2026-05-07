"use client"

import { motion } from "framer-motion"

export default function ExpertiseProof() {
  return (
    <>
      {/* Stats bar — 48h / 500+ / 56 */}
      <section className="bg-[#F0E8DC] border-y border-[#E8DDD0]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <a
              href="/chci-svatbu"
              className="inline-flex items-center gap-2 bg-white border border-[#E8DDD0] hover:border-[#C9A96E] text-[#2C2C2C] text-sm font-medium px-5 py-2.5 rounded-full transition-colors mb-5"
            >
              Jak služba funguje
            </a>

            <div className="flex flex-wrap gap-3 mb-5">
              {["zdarma", "odpověď do 48 hodin", "reálné ceny a podmínky"].map((p) => (
                <span key={p} className="bg-white border border-[#E8DDD0] text-[#2C2C2C]/80 text-xs sm:text-sm px-4 py-1.5 rounded-full font-medium">
                  {p}
                </span>
              ))}
            </div>

            <p className="text-[#2C2C2C]/75 text-sm md:text-base leading-relaxed max-w-lg">
              Jedno svatební místo sami provozujeme a dalších 10 spravujeme z marketingové,
              obchodní a mentorské báze. Nepracujeme s dojmy, ale s reálnou znalostí míst,
              cen a provozních omezení.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { num: "48 h", label: "ruční doporučení" },
              { num: "500+", label: "analyzovaných míst" },
              { num: "56", label: "poptávek denně" },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-[#E8DDD0] rounded-2xl p-4 sm:p-5">
                <div className="font-serif text-2xl sm:text-3xl font-light text-[#2C2C2C] mb-1">{s.num}</div>
                <div className="text-xs text-[#2C2C2C]/60 leading-snug">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DŮKAZ ODBORNOSTI */}
      <section className="py-24 md:py-32 px-6 md:px-10 bg-[#FEFDFB]">
        <div className="max-w-5xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[#C9A96E] text-xs font-semibold tracking-[.3em] uppercase mb-7"
          >
            Důkaz odbornosti
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif font-light text-4xl md:text-5xl lg:text-6xl leading-[1.05] mb-8 text-[#2C2C2C] max-w-3xl"
          >
            Doporučení stojí na datech, zkušenosti a provozní realitě.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-[#2C2C2C]/75 text-lg md:text-xl leading-relaxed max-w-3xl font-light"
          >
            Snoubenci od nás nedostávají jen hezké fotky. Dostávají užší výběr míst, která
            dávají smysl pro jejich termín, rozpočet, styl svatby i očekávání hostů.
          </motion.p>
        </div>
      </section>
    </>
  )
}
