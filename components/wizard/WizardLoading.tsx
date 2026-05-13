"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { toCzechVocative } from "@/lib/czech-vocative"

export default function WizardLoading({ name }: { name?: string }) {
  const firstName = toCzechVocative(name ?? "")

  // Personalizované zprávy — když máme jméno, oslovujeme přímo
  const messages = [
    firstName ? `Procházíme Váš profil, ${firstName}` : "Procházíme Váš profil",
    "Vyhodnocujeme přes 200 míst v celé ČR",
    "Porovnáváme rozpočet, kapacitu i Vaše preference",
    firstName
      ? `Vybíráme 5 nejlepších míst přesně pro Vás, ${firstName}`
      : "Vybíráme 5 nejlepších míst přesně pro Vás",
    "Připravujeme Váš osobní návrh",
  ]

  const [msg, setMsg] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setMsg((m) => (m + 1) % messages.length), 1300)
    return () => clearInterval(id)
  }, [messages.length])

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#FEFDFB] via-[#F9F2E6] to-[#F0E8DC] flex flex-col items-center justify-center px-6">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C9A96E]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#3E2723]/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        <RingsAnimation />
      </div>

      <div className="mt-12 text-center min-h-[100px] max-w-xl">
        <motion.p
          key={msg}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4 }}
          className="font-serif text-2xl md:text-3xl font-light text-[#3E2723] mb-4"
        >
          {messages[msg]}
        </motion.p>
        <p className="text-charcoal/60 text-sm md:text-base font-light tracking-wide italic leading-relaxed max-w-md mx-auto">
          Jediná služba v ČR, která Vám podle Vašich kritérií vybere svatební místo
          šité přímo na míru — žádné šablony, žádné kompromisy.
        </p>
      </div>

      <div className="flex gap-2 mt-8">
        {messages.map((_, i) => (
          <motion.div
            key={i}
            animate={{
              backgroundColor: i === msg ? "#C9A96E" : "#E8DDD0",
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

function RingsAnimation() {
  return (
    <div className="relative w-72 h-72">
      <svg viewBox="0 0 240 240" width="100%" height="100%" className="overflow-visible">
        <defs>
          {/* Realistický zlatý gradient pro prstýnky */}
          <linearGradient id="goldBand" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8B6914" />
            <stop offset="15%" stopColor="#C9A96E" />
            <stop offset="35%" stopColor="#FFE4A0" />
            <stop offset="50%" stopColor="#FFFAF0" />
            <stop offset="65%" stopColor="#F4D78F" />
            <stop offset="85%" stopColor="#A88240" />
            <stop offset="100%" stopColor="#5C4419" />
          </linearGradient>

          <linearGradient id="goldBand2" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#8B6914" />
            <stop offset="20%" stopColor="#C9A96E" />
            <stop offset="45%" stopColor="#FFE4A0" />
            <stop offset="55%" stopColor="#FFFAF0" />
            <stop offset="75%" stopColor="#F4D78F" />
            <stop offset="100%" stopColor="#5C4419" />
          </linearGradient>

          {/* Lesk uvnitř prstýnku */}
          <linearGradient id="goldHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF8E0" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#FFFAF0" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FFF8E0" stopOpacity="0.6" />
          </linearGradient>

          {/* Diamant — tabulka, korunka, lesk */}
          <radialGradient id="diamondCenter" cx="50%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="40%" stopColor="#F0F8FF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#B8D4F0" stopOpacity="0.85" />
          </radialGradient>

          <linearGradient id="diamondFacet1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#A8C8E8" stopOpacity="0.7" />
          </linearGradient>

          <linearGradient id="diamondFacet2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#90B0D8" stopOpacity="0.7" />
          </linearGradient>

          {/* Stín pod prstýnky */}
          <radialGradient id="shadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Stín pod prstýnky */}
        <ellipse cx="120" cy="200" rx="80" ry="6" fill="url(#shadow)" />

        {/* PRVNÍ PRSTÝNEK — vlevo, ve 3/4 pohledu */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "85px 120px" }}
        >
          {/* Hlavní tělo prstýnku — 3D iluze pomocí dvou elips */}
          <ellipse
            cx="85" cy="120" rx="48" ry="50"
            fill="none" stroke="url(#goldBand)" strokeWidth="9"
          />
          {/* Vnitřní stín prstýnku (dává hloubku) */}
          <ellipse
            cx="85" cy="120" rx="42" ry="44"
            fill="none" stroke="#5C4419" strokeWidth="1" opacity="0.5"
          />
          {/* Lesk na vnější straně */}
          <ellipse
            cx="85" cy="120" rx="50" ry="52"
            fill="none" stroke="url(#goldHighlight)" strokeWidth="1.5"
            opacity="0.7"
          />

          {/* Diamantový set — koruna držící kámen */}
          <g transform="translate(85, 70)">
            {/* Ocelové kotvy držící diamant */}
            <path d="M -7 0 L -10 -5 L -8 -10 L -4 -8 Z" fill="url(#goldBand)" stroke="#8B6914" strokeWidth="0.4" />
            <path d="M 7 0 L 10 -5 L 8 -10 L 4 -8 Z" fill="url(#goldBand)" stroke="#8B6914" strokeWidth="0.4" />
            <path d="M 0 -3 L -3 -8 L 0 -12 L 3 -8 Z" fill="url(#goldBand)" stroke="#8B6914" strokeWidth="0.4" />

            {/* DIAMANT — brilliantní řez, pohled shora */}
            {/* Korunka diamantu */}
            <path d="M -10 -2 L -7 -10 L 7 -10 L 10 -2 L 5 4 L -5 4 Z"
                  fill="url(#diamondCenter)" stroke="#7090B0" strokeWidth="0.4" />
            {/* Vnitřní facety */}
            <path d="M -7 -10 L -3 -5 L -10 -2 Z" fill="url(#diamondFacet1)" opacity="0.85" />
            <path d="M 7 -10 L 3 -5 L 10 -2 Z" fill="url(#diamondFacet2)" opacity="0.85" />
            <path d="M -3 -5 L 0 -10 L 3 -5 Z" fill="#FFFFFF" opacity="0.7" />
            <path d="M -3 -5 L 3 -5 L 5 4 L 0 0 L -5 4 Z" fill="url(#diamondFacet1)" opacity="0.5" />
            {/* Bod světla na diamantu */}
            <circle cx="-3" cy="-7" r="1.2" fill="#FFFFFF" opacity="0.95" />
            <circle cx="2" cy="-6" r="0.6" fill="#FFFFFF" opacity="0.7" />
          </g>
        </motion.g>

        {/* DRUHÝ PRSTÝNEK — vpravo, propletený s prvním */}
        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "155px 120px" }}
        >
          <ellipse
            cx="155" cy="120" rx="48" ry="50"
            fill="none" stroke="url(#goldBand2)" strokeWidth="9"
          />
          <ellipse
            cx="155" cy="120" rx="42" ry="44"
            fill="none" stroke="#5C4419" strokeWidth="1" opacity="0.5"
          />
          <ellipse
            cx="155" cy="120" rx="50" ry="52"
            fill="none" stroke="url(#goldHighlight)" strokeWidth="1.5"
            opacity="0.7"
          />

          <g transform="translate(155, 170)">
            <path d="M -7 0 L -10 5 L -8 10 L -4 8 Z" fill="url(#goldBand)" stroke="#8B6914" strokeWidth="0.4" />
            <path d="M 7 0 L 10 5 L 8 10 L 4 8 Z" fill="url(#goldBand)" stroke="#8B6914" strokeWidth="0.4" />
            <path d="M 0 3 L -3 8 L 0 12 L 3 8 Z" fill="url(#goldBand)" stroke="#8B6914" strokeWidth="0.4" />

            <path d="M -10 2 L -7 10 L 7 10 L 10 2 L 5 -4 L -5 -4 Z"
                  fill="url(#diamondCenter)" stroke="#7090B0" strokeWidth="0.4" />
            <path d="M -7 10 L -3 5 L -10 2 Z" fill="url(#diamondFacet1)" opacity="0.85" />
            <path d="M 7 10 L 3 5 L 10 2 Z" fill="url(#diamondFacet2)" opacity="0.85" />
            <path d="M -3 5 L 0 10 L 3 5 Z" fill="#FFFFFF" opacity="0.7" />
            <circle cx="3" cy="7" r="1.2" fill="#FFFFFF" opacity="0.95" />
            <circle cx="-2" cy="6" r="0.6" fill="#FFFFFF" opacity="0.7" />
          </g>
        </motion.g>

        {/* JEMNÉ JISKŘENÍ kolem (ne emoji, jen body světla) */}
        {[
          { x: 50,  y: 70,  delay: 0,   r: 1.5 },
          { x: 195, y: 80,  delay: 0.6, r: 2 },
          { x: 200, y: 175, delay: 1.2, r: 1.2 },
          { x: 45,  y: 180, delay: 1.8, r: 1.8 },
          { x: 120, y: 35,  delay: 0.3, r: 1 },
          { x: 120, y: 210, delay: 1.5, r: 1.3 },
        ].map((s, i) => (
          <motion.circle
            key={i}
            cx={s.x} cy={s.y} r={s.r}
            fill="#FFFAF0"
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: s.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>
    </div>
  )
}
