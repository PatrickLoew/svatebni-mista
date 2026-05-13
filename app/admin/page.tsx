"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { MapPin, MessageSquare, Star, Clock } from "lucide-react"

interface Stats { venues: number; inquiries: number; featured: number; newInquiries: number }

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/venues").then((r) => r.json()),
      fetch("/api/inquiries").then((r) => r.json()),
    ]).then(([venues, inquiries]) => {
      setStats({
        venues:       venues.length,
        inquiries:    inquiries.length,
        featured:     venues.filter((v: { isFeatured: boolean }) => v.isFeatured).length,
        newInquiries: inquiries.filter((i: { status: string }) => i.status === "new").length,
      })
    })
  }, [])

  const cards = stats
    ? [
        { label: "Celkem míst", value: stats.venues, icon: MapPin, color: "bg-blue-50 text-blue-600", href: "/admin/venues" },
        { label: "Poptávky", value: stats.inquiries, icon: MessageSquare, color: "bg-purple-50 text-purple-600", href: "/admin/inquiries" },
        { label: "Doporučená místa", value: stats.featured, icon: Star, color: "bg-[#C9A96E]/10 text-[#C9A96E]", href: "/admin/venues" },
        { label: "Nové poptávky", value: stats.newInquiries, icon: Clock, color: "bg-green-50 text-green-600", href: "/admin/inquiries" },
      ]
    : []

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold mb-1">Přehled</h1>
        <p className="text-charcoal/60 text-sm">Vítejte v administraci Svatebních míst</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats === null
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))
          : cards.map((c) => (
              <Link key={c.label} href={c.href} className="bg-white rounded-2xl p-6 border border-[#E8DDD0] hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.color}`}>
                  <c.icon size={18} />
                </div>
                <div className="font-display text-2xl font-semibold text-charcoal">{c.value}</div>
                <div className="text-charcoal/60 text-sm mt-1">{c.label}</div>
              </Link>
            ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/venues/new" className="bg-[#C9A96E] text-white rounded-2xl p-6 hover:bg-[#A88240] transition-colors">
          <div className="font-semibold text-lg mb-1">+ Přidat nové místo</div>
          <div className="text-white/70 text-sm">Přidejte nové svatební místo do katalogu</div>
        </Link>
        <Link href="/admin/inquiries" className="bg-[#0A0A0A] text-white rounded-2xl p-6 hover:bg-charcoal transition-colors">
          <div className="font-semibold text-lg mb-1">Správa poptávek</div>
          <div className="text-white/70 text-sm">Zobrazit a spravovat příchozí poptávky</div>
        </Link>
      </div>
    </div>
  )
}
