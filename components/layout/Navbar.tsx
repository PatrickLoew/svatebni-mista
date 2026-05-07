"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"

const links = [
  { href: "/#process", label: "Jak to funguje", external: false },
  { href: "/#o-sluzbe", label: "O službě", external: false },
  { href: "/venues", label: "VIP místa", external: false },
  { href: "/#faq", label: "FAQ", external: false },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener("scroll", onScroll)
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-2xl bg-white/85 border-b border-[#E8DDD0] py-3 shadow-sm"
          : "backdrop-blur-md bg-white/40 py-5"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white border border-[#E8DDD0] flex items-center justify-center font-serif text-sm font-semibold text-[#2C2C2C] shadow-sm">
            SM
          </div>
          <div className="leading-tight">
            <div className="font-serif text-base sm:text-lg font-medium text-[#2C2C2C]">
              svatebnimista.cz
            </div>
            <div className="text-[9px] sm:text-[10px] tracking-[.2em] uppercase text-[#2C2C2C]/55 font-semibold">
              Svatební místo na míru
            </div>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => {
            const cn = "text-sm font-medium text-[#2C2C2C]/75 hover:text-[#2C2C2C] transition-colors"
            return l.external ? (
              <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className={cn}>
                {l.label}
              </a>
            ) : (
              <Link key={l.href} href={l.href} className={cn}>
                {l.label}
              </Link>
            )
          })}
          <Link
            href="/chci-svatbu"
            className="bg-[#C9A96E] text-white text-sm font-medium px-6 py-2.5 rounded-full hover:bg-[#A88240] transition-colors"
          >
            Získat místo na míru
          </Link>
        </div>

        <button
          className="md:hidden p-2 text-[#2C2C2C] transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-[#E8DDD0]"
          >
            <div className="px-6 py-5 flex flex-col gap-3">
              {links.map((l) => {
                const cn = "text-sm font-medium py-2 border-b border-[#F0E8DC]"
                return l.external ? (
                  <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className={cn} onClick={() => setOpen(false)}>
                    {l.label}
                  </a>
                ) : (
                  <Link key={l.href} href={l.href} className={cn} onClick={() => setOpen(false)}>
                    {l.label}
                  </Link>
                )
              })}
              <Link
                href="/chci-svatbu"
                className="bg-[#C9A96E] text-white text-sm font-medium px-6 py-3 rounded-full text-center mt-3"
                onClick={() => setOpen(false)}
              >
                Získat místo na míru
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
