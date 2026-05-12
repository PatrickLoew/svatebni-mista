"use client"

import { motion } from "framer-motion"
import { CheckCircle, Calendar, Sparkles, Phone, Mail } from "lucide-react"
import ConsultationButton from "@/components/consultation/ConsultationButton"
import Link from "next/link"

export default function ConsultationCTA() {
  return (
    <section
      id="consultation"
      className="relative py-24 sm:py-32 px-6 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1F1310 0%, #3E2723 50%, #1F1310 100%)",
      }}
    >
      {/* Decorative blobs — pointer-events-none aby neblokovaly kliky */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#C9A96E]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#C9A96E]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto">
        {/* Hlavička sekce */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-white"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="h-px w-10 bg-[#C9A96E]" />
            <span className="text-[#E8C98A] text-xs font-semibold tracking-[.3em] uppercase">
              Začněte hledat své místo
            </span>
            <span className="h-px w-10 bg-[#C9A96E]" />
          </div>

          <h2 className="font-serif font-light text-3xl sm:text-4xl md:text-6xl leading-[1.05] mb-5 max-w-3xl mx-auto">
            Najděte své <em className="text-[#E8C98A]">svatební místo na míru</em>
          </h2>

          <p className="text-white/70 leading-relaxed max-w-2xl mx-auto mb-12 sm:mb-14 font-light text-base sm:text-lg">
            Jediná služba v ČR, která vám podle vašich kritérií vyhodnotí nejlepší
            svatební místo. Vyberte si cestu — obě jsou zdarma a bez závazku.
          </p>
        </motion.div>

        {/* Dvě hlavní karty */}
        <div className="grid md:grid-cols-2 gap-5 sm:gap-6 max-w-4xl mx-auto">
          {/* Karta 1: Wizard */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-7 sm:p-10 hover:border-[#C9A96E]/40 transition-colors group"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#C9A96E]/15 flex items-center justify-center mb-6 group-hover:bg-[#C9A96E]/25 transition-colors">
              <Sparkles size={22} className="text-[#E8C98A]" />
            </div>

            <h3 className="font-serif text-2xl md:text-3xl text-white font-light mb-3">
              Svatební místo na míru
            </h3>
            <p className="text-white/65 leading-relaxed mb-6 text-sm">
              6 otázek, 5 minut. Naše analýza projde stovky míst
              a do 24 hodin dostanete osobní výběr 3 míst přímo na e-mail.
            </p>

            <ul className="space-y-2 mb-8 text-sm">
              {["Osobní výběr 3 míst přímo pro vás", "Detail rozpočtu a parametry", "Bez nutnosti hovoru"].map((b) => (
                <li key={b} className="flex items-center gap-2 text-white/85">
                  <CheckCircle size={14} className="text-[#C9A96E] flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>

            <Link
              href="/chci-svatbu"
              className="inline-flex items-center justify-center gap-2 w-full bg-[#C9A96E] text-white font-medium py-3.5 rounded-full hover:bg-[#A88240] transition-colors"
            >
              Spustit analýzu →
            </Link>
          </motion.div>

          {/* Karta 2: Konzultace */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="relative backdrop-blur-2xl bg-[#C9A96E]/10 border border-[#C9A96E]/30 rounded-3xl p-7 sm:p-10 hover:border-[#C9A96E]/60 transition-colors group overflow-hidden"
          >
            {/* Dekorativní blob — pointer-events-none aby neblokoval kliky! */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#C9A96E]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-[#C9A96E]/30 flex items-center justify-center mb-6 group-hover:bg-[#C9A96E]/40 transition-colors">
                <Calendar size={22} className="text-[#E8C98A]" />
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h3 className="font-serif text-2xl md:text-3xl text-white font-light">
                  Individuální konzultace
                </h3>
                <span className="bg-[#E8C98A] text-[#3E2723] text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                  Doporučeno
                </span>
              </div>

              <p className="text-white/70 leading-relaxed mb-6 text-sm">
                30 minut s naším specialistou na svatební místa. Online,
                telefonicky nebo osobně. Hlubší analýza, konkrétní doporučení.
              </p>

              <ul className="space-y-2 mb-8 text-sm">
                {["Osobní specialista", "Volba: online / telefon / osobně", "Konkrétní termíny do 24 hodin"].map((b) => (
                  <li key={b} className="flex items-center gap-2 text-white/85">
                    <CheckCircle size={14} className="text-[#E8C98A] flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>

              <ConsultationButton
                label="Domluvit konzultaci"
                variant="primary"
                size="md"
                className="w-full justify-center !py-3.5"
                source="homepage-cta"
              />
            </div>
          </motion.div>
        </div>

        {/* Přímý telefonní kontakt — teplé zakončení */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-14 sm:mt-16 max-w-3xl mx-auto"
        >
          <div className="text-center mb-6">
            <p className="font-serif text-xl sm:text-2xl font-light text-white italic mb-2">
              Nebo nám prostě zavolejte
            </p>
            <p className="text-white/60 text-sm font-light">
              Jsme tu pro vás každý všední den od 9 do 18 hodin.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 sm:gap-4">
            {/* Telefon */}
            <a
              href="tel:+420123456789"
              className="group flex items-center justify-center gap-3 bg-[#E8C98A]/10 hover:bg-[#E8C98A]/20 border-2 border-[#E8C98A]/40 hover:border-[#E8C98A] rounded-2xl px-7 py-5 transition-all"
            >
              <div className="w-11 h-11 rounded-full bg-[#E8C98A] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Phone size={18} className="text-[#3E2723]" />
              </div>
              <div className="text-left">
                <div className="text-white/60 text-[10px] font-semibold tracking-[.2em] uppercase mb-0.5">Zavolejte nám</div>
                <div className="font-serif text-xl sm:text-2xl text-white">+420 123 456 789</div>
              </div>
            </a>

            {/* E-mail */}
            <a
              href="mailto:svatebnimista@svatebnimista.cz"
              className="group flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border-2 border-white/20 hover:border-white/40 rounded-2xl px-7 py-5 transition-all"
            >
              <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Mail size={18} className="text-[#E8C98A]" />
              </div>
              <div className="text-left">
                <div className="text-white/60 text-[10px] font-semibold tracking-[.2em] uppercase mb-0.5">Napište nám</div>
                <div className="font-serif text-base sm:text-lg text-white">svatebnimista@svatebnimista.cz</div>
              </div>
            </a>
          </div>

          {/* Teplé zakončení */}
          <div className="text-center mt-10 pt-8 border-t border-white/10">
            <p className="font-serif text-lg sm:text-xl text-white/90 italic font-light leading-relaxed max-w-xl mx-auto">
              &bdquo;Ať už zvolíte cokoliv — vždy se s vámi rádi spojíme.
              Těšíme se, že budeme moci být součástí vašeho příběhu.&ldquo;
            </p>
            <p className="text-[#E8C98A] text-xs tracking-[.25em] uppercase font-semibold mt-4">
              — Tým Svatební Místa
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
