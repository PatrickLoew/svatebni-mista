"use client"

import { useRef } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { Heart, Award, MapPin, ChevronDown } from "lucide-react"
import type { SiteSettings } from "@/lib/settings"

export default function Hero({ settings }: { settings: SiteSettings }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "40%"])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15])
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <section ref={ref} className="relative h-[100vh] min-h-[700px] flex items-center overflow-hidden">
      {/* Cinematic background */}
      <motion.div style={{ y, scale }} className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${settings.heroBackgroundUrl}')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
      </motion.div>

      {/* Decorative ornament */}
      <motion.div
        initial={{ opacity: 0, scale: .5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 1 }}
        className="absolute top-32 right-12 hidden lg:block"
      >
        <div className="w-px h-32 bg-gradient-to-b from-transparent via-[#C9A96E] to-transparent" />
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 w-full grid lg:grid-cols-12 gap-10 items-center"
      >
        <div className="lg:col-span-7 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-[#C9A96E]/15 backdrop-blur-md border border-[#C9A96E]/40 px-4 py-2 rounded-full mb-7"
          >
            <span className="text-[#E8C98A]">✦</span>
            <span className="text-[#E8C98A] text-[11px] sm:text-xs font-semibold tracking-[.2em] uppercase">
              {settings.heroEyebrow}
            </span>
          </motion.div>

          <h1 className="font-serif font-light text-4xl sm:text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.02] tracking-tight mb-6 sm:mb-8">
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="block"
            >
              {settings.heroTitleLine1}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="block italic text-[#E8C98A]"
            >
              {settings.heroTitleLine2}
            </motion.span>
            {settings.heroTitleLine3 && (
              <motion.span
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="block italic text-[#E8C98A]"
              >
                {settings.heroTitleLine3}
              </motion.span>
            )}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="text-white/85 text-base sm:text-lg md:text-xl leading-relaxed max-w-xl mb-8 sm:mb-10 font-light"
          >
            {settings.heroSubtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              href="/chci-svatbu"
              className="group bg-[#C9A96E] text-white font-medium px-6 sm:px-9 py-4 rounded-full hover:bg-[#A88240] transition-all hover:scale-[1.02] inline-flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {settings.heroPrimaryCta}
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <a
              href="https://www.wedding-point.cz"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white/40 backdrop-blur-md bg-white/5 text-white font-medium px-6 sm:px-9 py-4 rounded-full hover:bg-white/15 transition-all inline-flex items-center justify-center text-sm sm:text-base"
            >
              {settings.heroSecondaryCta}
            </a>
          </motion.div>
        </div>

        {/* Floating glass trust cards */}
        <div className="lg:col-span-5 hidden lg:block">
          <div className="relative h-[480px]">
            {[
              {
                icon: Award,
                title: "Jediná v ČR",
                subtitle: "služba pro výběr místa na míru",
                pos: "top-0 right-8",
                delay: 1.4,
              },
              {
                icon: MapPin,
                title: "200+",
                subtitle: "prověřených svatebních míst",
                pos: "top-44 right-32",
                delay: 1.6,
              },
              {
                icon: Heart,
                title: "Do 24 hodin",
                subtitle: "návrh 5 míst přímo do mailu",
                pos: "bottom-12 right-4",
                delay: 1.8,
              },
            ].map((c) => (
              <motion.div
                key={c.subtitle}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: c.delay, duration: 0.8 }}
                whileHover={{ y: -6, scale: 1.03 }}
                className={`absolute ${c.pos} w-64 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-5 shadow-2xl`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#C9A96E]/30 flex items-center justify-center backdrop-blur-md">
                    <c.icon className="text-[#E8C98A]" size={20} />
                  </div>
                  <div>
                    <div className="font-serif text-2xl text-white font-light leading-none">{c.title}</div>
                    <div className="text-white/70 text-xs mt-1">{c.subtitle}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{ opacity: { delay: 2 }, y: { repeat: Infinity, duration: 2.5, delay: 2 } }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 z-10 flex flex-col items-center gap-1"
      >
        <span className="text-[10px] tracking-[.3em] uppercase">scroll</span>
        <ChevronDown size={20} />
      </motion.div>
    </section>
  )
}
