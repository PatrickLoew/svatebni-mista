"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toCzechVocative } from "@/lib/czech-vocative"

const MESSAGE_DURATION_MS = 1900 // 1.9s na zprávu — komfortní čtení

export default function WizardLoading({
  name,
  isFinalizing,
}: {
  name?: string
  isFinalizing?: boolean
}) {
  const firstName = toCzechVocative(name ?? "")

  const searchingMessages = [
    firstName ? `Procházíme Váš profil, ${firstName}` : "Procházíme Váš profil",
    "Vyhodnocujeme přes 200 míst v celé ČR",
    "Porovnáváme rozpočet, kapacitu i Vaše preference",
    firstName
      ? `Vybíráme 5 nejlepších míst přesně pro Vás, ${firstName}`
      : "Vybíráme 5 nejlepších míst přesně pro Vás",
  ]
  const finalMessage = firstName
    ? `Vaše místa jsou připravena, ${firstName}`
    : "Vaše místa jsou připravena"

  const [msg, setMsg] = useState(0)

  // Cyklický posun zpráv během searching fáze (loop)
  useEffect(() => {
    if (isFinalizing) return
    const id = setTimeout(
      () => setMsg((m) => (m + 1) % searchingMessages.length),
      MESSAGE_DURATION_MS,
    )
    return () => clearTimeout(id)
  }, [msg, isFinalizing, searchingMessages.length])

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#FEFDFB] via-[#F9F2E6] to-[#F0E8DC] flex flex-col items-center justify-center px-6">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C9A96E]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#3E2723]/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        <RingsAnimation isFinalizing={isFinalizing ?? false} />
      </div>

      <div className="mt-10 text-center min-h-[110px] max-w-xl">
        <AnimatePresence mode="wait">
          <motion.p
            key={isFinalizing ? "final" : `msg-${msg}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="font-serif text-2xl md:text-3xl font-light text-[#3E2723] mb-4"
          >
            {isFinalizing ? finalMessage : searchingMessages[msg]}
          </motion.p>
        </AnimatePresence>

        <p className="text-charcoal/60 text-sm md:text-base font-light tracking-wide italic leading-relaxed max-w-md mx-auto">
          {isFinalizing
            ? "Náš osobní návrh právě dopisujeme. Vydržte chvíli."
            : "Jediná služba v ČR, která Vám podle Vašich kritérií vybere svatební místo šité přímo na míru."}
        </p>
      </div>

      {/* Progress dots — jen v searching fázi */}
      {!isFinalizing && (
        <div className="flex gap-2 mt-6">
          {searchingMessages.map((_, i) => (
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
      )}
    </div>
  )
}

/* ─────────── Animace prstýnků ─────────── */

function RingsAnimation({ isFinalizing }: { isFinalizing: boolean }) {
  return (
    <div className="relative w-80 h-80">
      <svg viewBox="0 0 280 280" width="100%" height="100%" className="overflow-visible">
        <defs>
          {/* Luxusní zlatý gradient pro kovový lesk */}
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

          <linearGradient id="goldShine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF8E0" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#FFFAF0" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFF8E0" stopOpacity="0.7" />
          </linearGradient>

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

          <radialGradient id="shadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="connectionGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFAF0" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#FFE4A0" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#C9A96E" stopOpacity="0" />
          </radialGradient>

          {/* Srdce gradient */}
          <linearGradient id="heartGold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E8C98A" />
            <stop offset="50%" stopColor="#C9A96E" />
            <stop offset="100%" stopColor="#A88240" />
          </linearGradient>
        </defs>

        {/* Soft shadow */}
        <ellipse cx="140" cy="240" rx="100" ry="8" fill="url(#shadow)" />

        {/* GLOW při spojení — viditelný jen ve finalizing fázi */}
        <motion.circle
          cx="140"
          cy="140"
          r="70"
          fill="url(#connectionGlow)"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{
            opacity: isFinalizing ? [0, 0.8, 0.6] : 0,
            scale: isFinalizing ? [0.5, 1.3, 1.2] : 0.3,
          }}
          transition={{ duration: isFinalizing ? 2.5 : 0, ease: "easeOut" }}
        />

        {/* PRVNÍ PRSTÝNEK */}
        <motion.g
          animate={
            isFinalizing
              ? {
                  // FINALIZING: rychlé přiblížení k centru
                  x: [-25, 0],
                  rotate: [0, 720],
                }
              : {
                  // SEARCHING: vznáší se na svojí pozici daleko od centra
                  x: [-25, -22, -25, -28, -25],
                  y: [0, -3, 0, 3, 0],
                  rotate: 0,
                }
          }
          transition={
            isFinalizing
              ? { duration: 2.5, ease: "easeInOut" }
              : { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }
          style={{ transformOrigin: "140px 140px" }}
        >
          {/* Hlavní zlatý kruh */}
          <ellipse cx="140" cy="140" rx="55" ry="58" fill="none" stroke="url(#goldA)" strokeWidth="10" />
          <ellipse cx="140" cy="140" rx="48" ry="51" fill="none" stroke="#5C4419" strokeWidth="1" opacity="0.5" />
          <ellipse cx="140" cy="140" rx="58" ry="61" fill="none" stroke="url(#goldShine)" strokeWidth="1.5" opacity="0.7" />

          {/* Diamantový set */}
          <g transform="translate(140, 82)">
            <path d="M -7 0 L -10 -5 L -8 -10 L -4 -8 Z" fill="url(#goldA)" stroke="#8B6914" strokeWidth="0.4" />
            <path d="M 7 0 L 10 -5 L 8 -10 L 4 -8 Z" fill="url(#goldA)" stroke="#8B6914" strokeWidth="0.4" />
            <path d="M 0 -3 L -3 -8 L 0 -12 L 3 -8 Z" fill="url(#goldA)" stroke="#8B6914" strokeWidth="0.4" />
            <path d="M -10 -2 L -7 -10 L 7 -10 L 10 -2 L 5 4 L -5 4 Z" fill="url(#diamondCore)" stroke="#7090B0" strokeWidth="0.4" />
            <path d="M -7 -10 L -3 -5 L -10 -2 Z" fill="url(#facet1)" opacity="0.85" />
            <path d="M 7 -10 L 3 -5 L 10 -2 Z" fill="url(#facet2)" opacity="0.85" />
            <path d="M -3 -5 L 0 -10 L 3 -5 Z" fill="#FFFFFF" opacity="0.7" />
            <path d="M -3 -5 L 3 -5 L 5 4 L 0 0 L -5 4 Z" fill="url(#facet1)" opacity="0.5" />
            <motion.circle
              cx="-3" cy="-7" r="1.4" fill="#FFFFFF"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <circle cx="2" cy="-6" r="0.7" fill="#FFFFFF" opacity="0.8" />
          </g>
        </motion.g>

        {/* DRUHÝ PRSTÝNEK */}
        <motion.g
          animate={
            isFinalizing
              ? {
                  x: [25, 0],
                  rotate: [0, -720],
                }
              : {
                  x: [25, 28, 25, 22, 25],
                  y: [0, 3, 0, -3, 0],
                  rotate: 0,
                }
          }
          transition={
            isFinalizing
              ? { duration: 2.5, ease: "easeInOut" }
              : { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
          }
          style={{ transformOrigin: "140px 140px" }}
        >
          <ellipse cx="140" cy="140" rx="55" ry="58" fill="none" stroke="url(#goldB)" strokeWidth="10" />
          <ellipse cx="140" cy="140" rx="48" ry="51" fill="none" stroke="#5C4419" strokeWidth="1" opacity="0.5" />
          <ellipse cx="140" cy="140" rx="58" ry="61" fill="none" stroke="url(#goldShine)" strokeWidth="1.5" opacity="0.7" />

          <g transform="translate(140, 198)">
            <path d="M -7 0 L -10 5 L -8 10 L -4 8 Z" fill="url(#goldA)" stroke="#8B6914" strokeWidth="0.4" />
            <path d="M 7 0 L 10 5 L 8 10 L 4 8 Z" fill="url(#goldA)" stroke="#8B6914" strokeWidth="0.4" />
            <path d="M 0 3 L -3 8 L 0 12 L 3 8 Z" fill="url(#goldA)" stroke="#8B6914" strokeWidth="0.4" />
            <path d="M -10 2 L -7 10 L 7 10 L 10 2 L 5 -4 L -5 -4 Z" fill="url(#diamondCore)" stroke="#7090B0" strokeWidth="0.4" />
            <path d="M -7 10 L -3 5 L -10 2 Z" fill="url(#facet1)" opacity="0.85" />
            <path d="M 7 10 L 3 5 L 10 2 Z" fill="url(#facet2)" opacity="0.85" />
            <path d="M -3 5 L 0 10 L 3 5 Z" fill="#FFFFFF" opacity="0.7" />
            <motion.circle
              cx="3" cy="7" r="1.4" fill="#FFFFFF"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
            <circle cx="-2" cy="6" r="0.7" fill="#FFFFFF" opacity="0.8" />
          </g>
        </motion.g>

        {/* PULZUJÍCÍ SRDCE — uprostřed mezi prstýnky, heart-beat rytmus */}
        <motion.g
          animate={{
            scale: isFinalizing
              ? [1, 1.4, 1.2]  // velký pulse při spojení
              : [1, 1.12, 1, 1.18, 1],  // lub-dub rytmus (dva údery, pauza)
          }}
          transition={{
            duration: isFinalizing ? 2.5 : 1.2,
            repeat: isFinalizing ? 0 : Infinity,
            times: isFinalizing ? [0, 0.6, 1] : [0, 0.15, 0.3, 0.45, 1],
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "140px 140px" }}
        >
          {/* Heart path — křivka srdce, zlatý outline + soft fill */}
          <path
            d="M 140 130
               C 130 115, 110 115, 110 132
               C 110 148, 140 165, 140 165
               C 140 165, 170 148, 170 132
               C 170 115, 150 115, 140 130 Z"
            fill="url(#heartGold)"
            stroke="#A88240"
            strokeWidth="1.5"
            opacity="0.85"
          />
          {/* Inner highlight on heart */}
          <path
            d="M 124 124 C 122 122, 120 126, 122 130"
            stroke="#FFFAF0"
            strokeWidth="1.5"
            fill="none"
            opacity="0.7"
            strokeLinecap="round"
          />
        </motion.g>

        {/* SEARCHING: jiskření po obvodu — víc decentní */}
        {!isFinalizing && [
          { x: 50, y: 80, delay: 0, r: 1.5 },
          { x: 225, y: 80, delay: 0.8, r: 2 },
          { x: 230, y: 200, delay: 1.6, r: 1.3 },
          { x: 45, y: 200, delay: 2.4, r: 1.8 },
          { x: 140, y: 35, delay: 0.4, r: 1 },
          { x: 140, y: 245, delay: 2, r: 1.3 },
          { x: 90, y: 50, delay: 1.2, r: 0.8 },
          { x: 200, y: 50, delay: 2.8, r: 1 },
        ].map((s, i) => (
          <motion.circle
            key={i}
            cx={s.x} cy={s.y} r={s.r} fill="#FFFAF0"
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

        {/* FINALIZING: vznášející se zlatá srdíčka nahoru po spojení */}
        {isFinalizing && [
          { x: 100, delay: 0.5 },
          { x: 140, delay: 0.7 },
          { x: 180, delay: 0.9 },
          { x: 120, delay: 1.1 },
          { x: 160, delay: 1.3 },
        ].map((h, i) => (
          <motion.g
            key={i}
            initial={{ opacity: 0, y: 0, scale: 0.3 }}
            animate={{
              opacity: [0, 0.9, 0],
              y: -120,
              scale: [0.3, 1, 0.7],
            }}
            transition={{
              duration: 2,
              delay: h.delay,
              ease: "easeOut",
            }}
          >
            <path
              d={`M ${h.x} 140
                  C ${h.x - 5} 134, ${h.x - 12} 134, ${h.x - 12} 142
                  C ${h.x - 12} 150, ${h.x} 158, ${h.x} 158
                  C ${h.x} 158, ${h.x + 12} 150, ${h.x + 12} 142
                  C ${h.x + 12} 134, ${h.x + 5} 134, ${h.x} 140 Z`}
              fill="url(#heartGold)"
              opacity="0.85"
            />
          </motion.g>
        ))}

        {/* FINALIZING: středová hvězda */}
        {isFinalizing && (
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0.5], scale: [0, 1.4, 1.2] }}
            transition={{ duration: 2.5, ease: "easeOut" }}
          >
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "140px 140px" }}
            >
              <path
                d="M 140 110 L 142 138 L 170 140 L 142 142 L 140 170 L 138 142 L 110 140 L 138 138 Z"
                fill="#FFFAF0" opacity="0.95"
              />
            </motion.g>
          </motion.g>
        )}
      </svg>
    </div>
  )
}
