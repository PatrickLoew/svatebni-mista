"use client"

import { motion } from "framer-motion"
import { Search, Heart, Star, CheckCircle } from "lucide-react"

const services = [
  {
    icon: Search,
    title: "Chytrý katalog",
    desc: "Filtrujte podle kraje, typu, kapacity i ceny. Najděte přesně to, co hledáte.",
  },
  {
    icon: Heart,
    title: "Snazší výběr",
    desc: "Detailní galerie, informace o službách a vybavení každého místa na jednom místě.",
  },
  {
    icon: Star,
    title: "Prověřená místa",
    desc: "Každé místo projde naší kontrolou kvality. Žádná špatná překvapení.",
  },
  {
    icon: CheckCircle,
    title: "Přímá poptávka",
    desc: "Odešlete poptávku přímo z webu. Odpovíme do 24 hodin.",
  },
]

export default function Services() {
  return (
    <section id="services" className="py-24 bg-[#0A0A0A] text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-[#C9A96E] text-sm font-semibold tracking-widest uppercase mb-3">
            ✦ Co nabízíme ✦
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold mb-4">
            Proč vybírat přes nás
          </h2>
          <div className="divider-gold mb-6" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-dark rounded-2xl p-7 group hover:border-[#C9A96E]/40 transition-colors"
            >
              <div className="w-12 h-12 bg-[#C9A96E]/15 rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#C9A96E]/30 transition-colors">
                <s.icon size={22} className="text-[#C9A96E]" />
              </div>
              <h3 className="font-semibold text-white mb-2">{s.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
