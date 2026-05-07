"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"

const links = [
  { href: "/chci-svatbu", label: "Místo na míru", external: false },
  { href: "/venues", label: "VIP místa", external: false },
  { href: "https://www.wedding-point.cz", label: "Celý katalog", external: true },
  { href: "/#process", label: "Jak to funguje", external: false },
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
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-2xl bg-white/80 border-b border-[#E8DDD0] py-3"
          : "bg-transparent py-6"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between">
        <Link href="/" className="group flex items-center gap-2">
          <motion.span
            initial={{ rotate: 0 }}
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.6 }}
            className={`text-2xl ${scrolled ? "text-[#C9A96E]" : "text-[#E8C98A]"}`}
          >
            ✦
          </motion.span>
          <span className={`font-serif text-xl font-light tracking-wide transition-colors ${
            scrolled ? "text-[#3E2723]" : "text-white"
          }`}>
            Svatební <span className="italic">Místa</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-9">
          {links.map((l) => {
            const cn = `text-sm font-medium transition-colors ${
              scrolled ? "text-charcoal/70 hover:text-[#3E2723]" : "text-white/80 hover:text-white"
            }`
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
            Spustit analýzu
          </Link>
        </div>

        <button
          className={`md:hidden p-2 transition-colors ${scrolled ? "text-charcoal" : "text-white"}`}
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
                Spustit analýzu
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
