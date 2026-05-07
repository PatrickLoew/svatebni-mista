"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail, Phone, MapPin } from "lucide-react"

const InstagramIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)

const FacebookIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
)

export default function Footer() {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)

  return (
    <footer className="bg-[#0F1F18] text-white/70">
      {/* Top: Newsletter */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-10 bg-[#C9A96E]" />
              <span className="text-[#E8C98A] text-xs font-medium tracking-[.3em] uppercase">Newsletter</span>
            </div>
            <h3 className="font-serif text-3xl md:text-4xl font-light text-white leading-tight">
              Inspirace ze světa <em className="text-[#E8C98A]">prémiových svateb</em>
            </h3>
            <p className="text-white/50 mt-3 font-light">
              Jednou měsíčně nová místa, trendy a tipy. Bez spamu.
            </p>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); if (email) setSubscribed(true) }}
            className="flex flex-col sm:flex-row gap-3"
          >
            {subscribed ? (
              <p className="text-[#E8C98A] font-light italic">Děkujeme — uvidíme se ve schránce ✦</p>
            ) : (
              <>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Vaše e-mailová adresa"
                  className="flex-1 bg-white/5 border border-white/15 rounded-full px-6 py-3.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#C9A96E] transition"
                />
                <button className="bg-[#C9A96E] text-white font-medium px-7 py-3.5 rounded-full hover:bg-[#A88240] transition-colors">
                  Odebírat
                </button>
              </>
            )}
          </form>
        </div>
      </div>

      {/* Middle: Columns */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[#C9A96E] text-2xl">✦</span>
            <span className="font-serif text-xl font-light text-white">
              Svatební <span className="italic">Místa</span>
            </span>
          </div>
          <p className="text-sm leading-relaxed font-light max-w-md">
            Prémiový svatební planning, catering a vyhledávání míst.
            Od první kávy až po poslední přípitek — postaráme se o všechno,
            co musí klapnout, abyste si svůj den jen užívali.
          </p>

          <div className="flex gap-3 mt-7">
            {[
              { icon: InstagramIcon, href: "#", label: "Instagram" },
              { icon: FacebookIcon, href: "#", label: "Facebook" },
              { icon: Mail, href: "mailto:info@svatebni-mista.cz", label: "E-mail" },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center hover:bg-[#C9A96E] hover:border-[#C9A96E] transition-colors"
              >
                <s.icon width={15} height={15} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-white font-medium mb-5 text-sm tracking-wider uppercase">Navigace</h4>
          <ul className="space-y-3 text-sm font-light">
            {[
              { href: "/venues", label: "Katalog míst" },
              { href: "/#process", label: "Jak fungujeme" },
              { href: "/#consultation", label: "Konzultace" },
              { href: "/#faq", label: "Časté otázky" },
              { href: "/admin", label: "Admin" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-[#E8C98A] transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-medium mb-5 text-sm tracking-wider uppercase">Kontakt</h4>
          <ul className="space-y-3 text-sm font-light">
            <li className="flex items-start gap-2">
              <Mail size={14} className="mt-0.5 text-[#C9A96E] flex-shrink-0" />
              <a href="mailto:info@svatebni-mista.cz" className="hover:text-[#E8C98A] transition-colors">
                info@svatebni-mista.cz
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Phone size={14} className="mt-0.5 text-[#C9A96E] flex-shrink-0" />
              <a href="tel:+420123456789" className="hover:text-[#E8C98A] transition-colors">
                +420 123 456 789
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin size={14} className="mt-0.5 text-[#C9A96E] flex-shrink-0" />
              <span>Praha 1, Česká republika</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 px-6 text-center text-xs text-white/30 font-light">
        © {new Date().getFullYear()} Svatební Místa.cz · Všechna práva vyhrazena ·
        <Link href="/admin" className="ml-2 hover:text-[#E8C98A] transition-colors">Admin</Link>
      </div>
    </footer>
  )
}
