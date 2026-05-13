"use client"

import { motion } from "framer-motion"
import { Coffee, MapPinned, Sparkles } from "lucide-react"
import type { SiteSettings } from "@/lib/settings"

export default function Process({ settings }: { settings: SiteSettings }) {
  const steps = [
    { num: "01", icon: Coffee, title: settings.process1Title, desc: settings.process1Desc },
    { num: "02", icon: MapPinned, title: settings.process2Title, desc: settings.process2Desc },
    { num: "03", icon: Sparkles, title: settings.process3Title, desc: settings.process3Desc },
  ]

  return (
    <section id="process" className="py-32 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-px w-10 bg-[#C9A96E]" />
            <span className="text-[#C9A96E] text-xs font-medium tracking-[.3em] uppercase">{settings.processEyebrow}</span>
            <span className="h-px w-10 bg-[#C9A96E]" />
          </div>
          <h2 className="font-serif font-light text-4xl md:text-5xl lg:text-6xl leading-[1.1] mb-5">
            {settings.processTitle}
          </h2>
          <p className="text-charcoal/60 max-w-2xl mx-auto leading-relaxed font-light">
            {settings.processSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-[#C9A96E]/40 to-transparent" />

          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.7 }}
              className="relative text-center group"
            >
              {/* Icon circle */}
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="absolute inset-0 bg-[#C9A96E]/15 rounded-full scale-150 group-hover:scale-[1.8] transition-transform duration-500" />
                <div className="relative w-32 h-32 rounded-full bg-white border border-[#E8DDD0] shadow-lg flex items-center justify-center group-hover:border-[#C9A96E] transition-colors">
                  <s.icon size={32} className="text-[#3E2723] group-hover:text-[#C9A96E] transition-colors" strokeWidth={1.5} />
                </div>
              </div>

              <div className="font-serif text-xs tracking-[.3em] text-[#C9A96E] mb-3">{s.num}</div>
              <h3 className="font-serif text-2xl md:text-3xl font-light text-charcoal mb-4">{s.title}</h3>
              <p className="text-charcoal/60 leading-relaxed font-light max-w-xs mx-auto">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
