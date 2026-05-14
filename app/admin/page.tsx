"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { MapPin, MessageSquare, Star, Clock, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"

interface Stats { venues: number; inquiries: number; featured: number; newInquiries: number }

interface SyncResult {
  ok?: boolean
  updated?: number
  inserted?: number
  skipped?: number
  skipped_vip?: number
  error?: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)

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

  async function syncSheet() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch("/api/admin/trigger-sync", { method: "POST" })
      const data: SyncResult = await res.json()
      setSyncResult(data)
      // Po úspěšném sync znova načti stats
      if (data.ok) {
        const [venues, inquiries] = await Promise.all([
          fetch("/api/venues").then((r) => r.json()),
          fetch("/api/inquiries").then((r) => r.json()),
        ])
        setStats({
          venues: venues.length,
          inquiries: inquiries.length,
          featured: venues.filter((v: { isFeatured: boolean }) => v.isFeatured).length,
          newInquiries: inquiries.filter((i: { status: string }) => i.status === "new").length,
        })
      }
    } catch (e) {
      setSyncResult({ error: e instanceof Error ? e.message : "Neznámá chyba" })
    } finally {
      setSyncing(false)
    }
  }

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

      {/* Sync z Google Sheets */}
      <div className="mb-10 bg-white rounded-2xl p-6 border border-[#E8DDD0]">
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-lg font-semibold mb-1">Synchronizace z Google Sheets</h2>
            <p className="text-charcoal/60 text-sm">
              Automaticky každý den v 6:00 ráno. Můžete kdykoli spustit manuálně —
              přepíše neVIP místa, VIP zůstávají chráněné.
            </p>
          </div>
          <button
            onClick={syncSheet}
            disabled={syncing}
            className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#A88240] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Synchronizuji…" : "Synchronizovat teď"}
          </button>
        </div>

        {syncResult && (
          <div className={`mt-4 p-4 rounded-xl border ${
            syncResult.error
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-green-50 border-green-200 text-green-800"
          }`}>
            <div className="flex items-start gap-2">
              {syncResult.error
                ? <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                : <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />}
              <div className="text-sm">
                {syncResult.error ? (
                  <span><strong>Chyba:</strong> {syncResult.error}</span>
                ) : (
                  <span>
                    <strong>Synchronizováno!</strong>{" "}
                    Aktualizováno {syncResult.updated}, vloženo {syncResult.inserted},
                    chráněných VIP {syncResult.skipped_vip}.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
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
