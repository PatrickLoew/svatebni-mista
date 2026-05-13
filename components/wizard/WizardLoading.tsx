"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toCzechVocative } from "@/lib/czech-vocative"

const MESSAGE_DURATION_MS = 2200  // 2.2s na každou zprávu — pomalejší aby šlo přečíst

export default function WizardLoading({ name }: { name?: string }) {
  const firstName = toCzechVocative(name ?? "")

  const messages = [
    firstName ? `Procházíme Váš profil, ${firstName}` : "Procházíme Váš profil",
    "Vyhodnocujeme přes 200 míst v celé ČR",
    "Porovnáváme rozpočet, kapacitu i Vaše preference",
    firstName
      ? `Vybíráme 5 nejlepších míst přesně pro Vás, ${firstName}`
      : "Vybíráme 5 nejlepších míst přesně pro Vás",
    "Připravujeme Váš osobní návrh",
    firstName ? `Brzy se uvidíme, ${firstName}` : "Brzy se uvidíme",
  ]

  const [msg, setMsg] = useState(0)

  useEffect(() => {
    if (msg >= messages.length - 1) return // poslední zpráva zůstane
    const id = setTimeout(() => setMsg((m) => m + 1), MESSAGE_DURATION_MS)
    return () => clearTimeout(id)
  }, [msg, messages.length])

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#FEFDFB] via-[#F9F2E6] to-[#F0E8DC] flex flex-col items-center justify-center px-6">
      {/* Decorative blur backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C9A96E]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#3E2723]/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        <RingsAnimation />
      </div>

      <div className="mt-12 text-center min-h-[110px] max-w-xl">
        <AnimatePresence mode="wait">
          <motion.p
            key={msg}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="font-serif text-2xl md:text-3xl font-light text-[#3E2723] mb-4"
          >
            {messages[msg]}
          </motion.p>
        </AnimatePresence>

        <p className="text-charcoal/60 text-sm md:text-base font-light tracking-wide italic leading-relaxed max-w-md mx-auto">
          Jediná služba v ČR, která Vám podle Vašich kritérií vybere svatební místo
          šité přímo na míru — žádné šablony, žádné kompromisy.
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mt-8">
        {messages.map((_, i) => (
          <motion.div
            key={i}
            animate={{
              backgroundColor: i === msg ? "#C9A96E" : i < msg ? "#E8C98A" : "#E8DDD0",
              scale: i === msg ? 1.4 : 1,
            }}
            transition={{ duration: 0.4 }}
            className="w-1.5 h-1.5 rounded-full"
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Animace prstýnků — luxusní svatební storytelling:
 * 1. (0-2s) Prstýnky jsou daleko od sebe, jemně se vznášejí
 * 2. (2-6s) Postupně se přibližují k sobě
 * 3. (6-9s) Začnou se propletovat
 * 4. (9-12s) Spojí se a vznikne jemný "blesk" světla
 * 5. (12s+) Pomalé otáčení spojených prstýnků = stabilní finální vzhled
 */
function RingsAnimation() {
  return (
    <div className="relative w-80 h-80">
      <svg viewBox="0 0 280 280" width="100%" height="100%" className="overflow-visible">
        <defs>
          {/* Luxusní zlatý gradient */}
          <linearGradient id="goldA" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8B6914" />
            <stop offset="20%" stopColor="#C9A96E" />
            <stop offset="40%" stopColor="#FFE4A0" />
            <stop offset="55%" stopColor="#FFFAF0" />
            <stop offset="70%" stopColor="#F4D78F" />
            <stop offset="90%" stopColor="#A88240" />
            <stop offset="100%" stopColor="#5C4419" />
          </linearGradient>

          <linearGradient id="goldB" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#8B6914" />
            <stop offset="25%" stopColor="#C9A96E" />
            <stop offset="50%" stopColor="#FFFAF0" />
            <stop offset="75%" stopColor="#F4D78F" />
            <stop offset="100%" stopColor="#5C4419" />
          </linearGradient>

          {/* Inner highlight (lesk uvnitř kovu) */}
          <linearGradient id="goldShine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF8E0" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#FFFAF0" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFF8E0" stopOpacity="0.7" />
          </linearGradient>

          {/* Diamond gradients */}
          <radialGradient id="diamondCore" cx="50%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#F0F8FF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#B8D4F0" stopOpacity="0.85" />
          </radialGradient>

          <linearGradient id="facet1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#A8C8E8" stopOpacity="0.7" />
          </linearGradient>

          <linearGradient id="facet2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#90B0D8" stopOpacity="0.7" />
          </linearGradient>

          {/* Soft shadow under rings */}
          <radialGradient id="shadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* Glow on connection */}
          <radialGradient id="connectionGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFAF0" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#FFE4A0" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#C9A96E" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Soft shadow */}
        <ellipse cx="140" cy="240" rx="100" ry="8" fill="url(#shadow)" />

        {/* GLOW při spojení (objeví se až později) */}
        <motion.circle
          cx="140"
          cy="140"
          r="70"
          fill="url(#connectionGlow)"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{
            opacity: [0, 0, 0, 0, 0.6, 0.8, 0.6],
            scale: [0.3, 0.5, 0.7, 0.9, 1.1, 1.3, 1.2],
          }}
          transition={{
            duration: 13,
            times: [0, 0.3, 0.5, 0.65, 0.75, 0.9, 1],
            ease: "easeOut",
          }}
        />

        {/* PRVNÍ PRSTÝNEK — začíná daleko vlevo, postupně se přibližuje */}
        <motion.g
          initial={{ x: -45, opacity: 0 }}
          animate={{
            x: [-45, -40, -30, -18, -5, 0, 0],
            opacity: [0, 1, 1, 1, 1, 1, 1],
            rotate: [0, 30, 90, 180, 300, 360, 720],
          }}
          transition={{
            duration: 13,
            times: [0, 0.1, 0.25, 0.45, 0.7, 0.85, 1],
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "140px 140px" }}
        >
          {/* Hlavní zlatý kruh */}
          <ellipse
            cx="140"
            cy="140"
            rx="55"
            ry="58"
            fill="none"
            stroke="url(#goldA)"
            strokeWidth="10"
          />
          {/* Vnitřní stín pro hloubku */}
          <ellipse
            cx="140"
            cy="140"
            rx="48"
            ry="51"
            fill="none"
            stroke="#5C4419"
            strokeWidth="1"
            opacity="0.5"
          />
          {/* Vnější lesk */}
          <ellipse
            cx="140"
            cy="140"
            rx="58"
            ry="61"
            fill="none"
            stroke="url(#goldShine)"
            strokeWidth="1.5"
            opacity="0.7"
          />

          {/* Diamantový set nahoře */}
          <g transform="translate(140, 82)">
            {/* Krájecí body držící diamant */}
            <path d="M -7 0 L -10 -5 L -8 -10 L -4 -8 Z" fill="url(#goldA)" stroke="#8B6914" strokeWidth="0.4" />
            <path d="M 7 0 L 10 -5 L 8 -10 L 4 -8 Z" fill="url(#goldA)" stroke="#8B6914" strokeWidth="0.4" />
            <path d="M 0 -3 L -3 -8 L 0 -12 L 3 -8 Z" fill="url(#goldA)" stroke="#8B6914" strokeWidth="0.4" />

            {/* DIAMANT */}
            <path
              d="M -10 -2 L -7 -10 L 7 -10 L 10 -2 L 5 4 L -5 4 Z"
              fill="url(#diamondCore)"
              stroke="#7090B0"
              strokeWidth="0.4"
            />
            <path d="M -7 -10 L -3 -5 L -10 -2 Z" fill="url(#facet1)" opacity="0.85" />
            <path d="M 7 -10 L 3 -5 L 10 -2 Z" fill="url(#facet2)" opacity="0.85" />
            <path d="M -3 -5 L 0 -10 L 3 -5 Z" fill="#FFFFFF" opacity="0.7" />
            <path d="M -3 -5 L 3 -5 L 5 4 L 0 0 L -5 4 Z" fill="url(#facet1)" opacity="0.5" />
            {/* Bod světla — trvá animaci */}
            <motion.circle
              cx="-3"
              cy="-7"
              r="1.4"
              fill="#FFFFFF"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <circle cx="2" cy="-6" r="0.7" fill="#FFFFFF" opacity="0.8" />
          </g>
        </motion.g>

        {/* DRUHÝ PRSTÝNEK — začíná daleko vpravo, postupně se přibližuje */}
        <motion.g
          initial={{ x: 45, opacity: 0 }}
          animate={{
            x: [45, 40, 30, 18, 5, 0, 0],
            opacity: [0, 1, 1, 1, 1, 1, 1],
            rotate: [0, -30, -90, -180, -300, -360, -720],
          }}
          transition={{
            duration: 13,
            times: [0, 0.1, 0.25, 0.45, 0.7, 0.85, 1],
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "140px 140px" }}
        >
          <ellipse
            cx="140"
            cy="140"
            rx="55"
            ry="58"
            fill="none"
            stroke="url(#goldB)"
            strokeWidth="10"
          />
          <ellipse
            cx="140"
            cy="140"
            rx="48"
            ry="51"
            fill="none"
            stroke="#5C4419"
            strokeWidth="1"
            opacity="0.5"
          />
          <ellipse
            cx="140"
            cy="140"
            rx="58"
            ry="61"
            fill="none"
            stroke="url(#goldShine)"
            strokeWidth="1.5"
            opacity="0.7"
          />

          {/* Diamantový set dole */}
          <g transform="translate(140, 198)">
            <path d="M -7 0 L -10 5 L -8 10 L -4 8 Z" fill="url(#goldA)" stroke="#8B6914" strokeWidth="0.4" />
            <path d="M 7 0 L 10 5 L 8 10 L 4 8 Z" fill="url(#goldA)" stroke="#8B6914" strokeWidth="0.4" />
            <path d="M 0 3 L -3 8 L 0 12 L 3 8 Z" fill="url(#goldA)" stroke="#8B6914" strokeWidth="0.4" />

            <path
              d="M -10 2 L -7 10 L 7 10 L 10 2 L 5 -4 L -5 -4 Z"
              fill="url(#diamondCore)"
              stroke="#7090B0"
              strokeWidth="0.4"
            />
            <path d="M -7 10 L -3 5 L -10 2 Z" fill="url(#facet1)" opacity="0.85" />
            <path d="M 7 10 L 3 5 L 10 2 Z" fill="url(#facet2)" opacity="0.85" />
            <path d="M -3 5 L 0 10 L 3 5 Z" fill="#FFFFFF" opacity="0.7" />
            <motion.circle
              cx="3"
              cy="7"
              r="1.4"
              fill="#FFFFFF"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
            <circle cx="-2" cy="6" r="0.7" fill="#FFFFFF" opacity="0.8" />
          </g>
        </motion.g>

        {/* JISKŘENÍ kolem — záhada svatebního dne */}
        {[
          { x: 50, y: 80, delay: 0, r: 1.5 },
          { x: 225, y: 80, delay: 0.8, r: 2 },
          { x: 230, y: 200, delay: 1.6, r: 1.3 },
          { x: 45, y: 200, delay: 2.4, r: 1.8 },
          { x: 140, y: 35, delay: 0.4, r: 1 },
          { x: 140, y: 245, delay: 2, r: 1.3 },
          { x: 90, y: 50, delay: 1.2, r: 0.8 },
          { x: 200, y: 50, delay: 2.8, r: 1 },
          { x: 200, y: 230, delay: 3.2, r: 0.9 },
          { x: 80, y: 230, delay: 3.6, r: 1.1 },
        ].map((s, i) => (
          <motion.circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="#FFFAF0"
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: s.delay,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Velký jiskřivý záblesk při spojení (cca 9-10 sec) */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 0, 0, 0.9, 0.4, 0] }}
          transition={{
            duration: 13,
            times: [0, 0.3, 0.5, 0.65, 0.75, 0.85, 1],
            ease: "easeOut",
          }}
        >
          {/* Středová hvězda */}
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "140px 140px" }}
          >
            <path d="M 140 110 L 142 138 L 170 140 L 142 142 L 140 170 L 138 142 L 110 140 L 138 138 Z" fill="#FFFAF0" opacity="0.95" />
          </motion.g>
        </motion.g>
      </svg>
    </div>
  )
}
