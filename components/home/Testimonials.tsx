"use client"

import { motion, useMotionValue, animate } from "framer-motion"
import { useEffect, useRef } from "react"
import { Quote } from "lucide-react"

const testimonials = [
  {
    name: "Lucie & Tomáš",
    location: "Zámek Hluboká, červen 2024",
    text: "Tým ze Svatební Místa proměnil naši vizi v něco, co jsme si ani nedovolovali snít. Každý detail seděl, každý moment byl naprosto náš. Hosté dodnes mluví o atmosféře, kterou se podařilo vytvořit.",
  },
  {
    name: "Petra & Martin",
    location: "Vinný sklep Mikulov, srpen 2024",
    text: "Hledali jsme něco autentického a přitom prémiového. Doporučili nám sklep, který jsme si zamilovali během prvních pěti minut. Catering, hudba, vína — vše perfektně sladěné.",
  },
  {
    name: "Jana & Radek",
    location: "Soukromá vila, září 2024",
    text: "Měli jsme jen 4 měsíce na přípravu a chtěli jsme nemožné — letní zahradní svatbu pro 80 lidí. Holky to zvládly s ledovým klidem. Profesionálky každým coulem.",
  },
  {
    name: "Klára & Adam",
    location: "Hotel Ambassador, květen 2025",
    text: "Investice do plánovače byla nejlepší rozhodnutí celé svatby. Nezvládly bychom to samy. Jejich síť kontaktů a vyjednávací schopnosti nám ušetřily desítky tisíc.",
  },
]

const stats = [
  { value: 500, suffix: "+", label: "svateb organizovaných" },
  { value: 200, suffix: "+", label: "prémiových míst" },
  { value: 49,  suffix: "/50", label: "průměrné hodnocení" },
  { value: 7,   suffix: " let", label: "zkušeností" },
]

function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(0)

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 2,
      ease: "easeOut",
      onUpdate(v) { if (ref.current) ref.current.textContent = Math.round(v).toString() },
    })
    return controls.stop
  }, [motionValue, value])

  return <span ref={ref}>0</span>
}

export default function Testimonials() {
  return (
    <section className="py-32 px-6 bg-[#3E2723] text-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.04]"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519741497674-611481863552?w=2400&q=85')", backgroundSize: "cover" }} />

      <div className="relative max-w-7xl mx-auto">
        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-20 mb-20 border-b border-white/10"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="font-serif text-5xl md:text-6xl text-[#E8C98A] font-light mb-2">
                <AnimatedNumber value={s.value} />
                <span>{s.suffix}</span>
              </div>
              <div className="text-white/50 text-xs tracking-[.2em] uppercase">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-px w-10 bg-[#C9A96E]" />
            <span className="text-[#E8C98A] text-xs font-medium tracking-[.3em] uppercase">Slova novomanželů</span>
            <span className="h-px w-10 bg-[#C9A96E]" />
          </div>
          <h2 className="font-serif font-light text-4xl md:text-5xl lg:text-6xl leading-[1.1] text-white">
            Příběhy, které <em className="text-[#E8C98A]">nás motivují</em>
          </h2>
        </div>

        {/* Testimonial grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              whileHover={{ y: -4 }}
              className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-[#C9A96E]/30 transition-colors"
            >
              <Quote size={26} className="text-[#C9A96E] mb-5" />
              <p className="font-serif text-lg md:text-xl leading-relaxed text-white/90 font-light italic mb-7">
                {t.text}
              </p>
              <div className="pt-5 border-t border-white/10">
                <p className="font-medium text-white">{t.name}</p>
                <p className="text-white/50 text-xs mt-1">{t.location}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
