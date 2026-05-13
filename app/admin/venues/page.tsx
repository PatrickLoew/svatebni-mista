"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Plus, Pencil, Trash2, Star } from "lucide-react"
import { formatPrice } from "@/lib/utils"

interface VenueRow {
  id: string; slug: string; title: string; location: string; region: string
  capacity: number; priceFrom: number; isFeatured: boolean; images: string[]
}

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<VenueRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/venues").then((r) => r.json()).then(setVenues).finally(() => setLoading(false))
  }, [])

  async function remove(id: string, title: string) {
    if (!confirm(`Smazat "${title}"?`)) return
    await fetch(`/api/venues/${id}`, { method: "DELETE" })
    setVenues((v) => v.filter((x) => x.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold mb-1">Místa</h1>
          <p className="text-charcoal/60 text-sm">{venues.length} míst celkem</p>
        </div>
        <Link
          href="/admin/venues/new"
          className="flex items-center gap-2 bg-[#C9A96E] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#A88240] transition-colors"
        >
          <Plus size={16} /> Přidat místo
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}
        </div>
      ) : venues.length === 0 ? (
        <div className="text-center py-20 text-charcoal/50">
          <MapPinOff className="mx-auto mb-4" />
          <p>Žádná místa. Přidejte první místo.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8DDD0] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F9F6F0] border-b border-[#E8DDD0]">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-charcoal/70">Místo</th>
                <th className="text-left px-5 py-3 font-semibold text-charcoal/70 hidden md:table-cell">Kraj</th>
                <th className="text-left px-5 py-3 font-semibold text-charcoal/70 hidden lg:table-cell">Kapacita</th>
                <th className="text-left px-5 py-3 font-semibold text-charcoal/70 hidden lg:table-cell">Cena od</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DDD0]">
              {venues.map((v) => (
                <tr key={v.id} className="hover:bg-[#F9F6F0] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#E8DDD0] flex-shrink-0">
                        {v.images[0] && (
                          <Image src={v.images[0]} alt={v.title} width={40} height={40} className="object-cover w-full h-full" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-charcoal flex items-center gap-1">
                          {v.title}
                          {v.isFeatured && <Star size={12} className="text-[#C9A96E] fill-[#C9A96E]" />}
                        </div>
                        <div className="text-charcoal/50 text-xs">{v.location}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-charcoal/70 hidden md:table-cell">{v.region}</td>
                  <td className="px-5 py-4 text-charcoal/70 hidden lg:table-cell">{v.capacity} hostů</td>
                  <td className="px-5 py-4 text-charcoal/70 hidden lg:table-cell">{formatPrice(v.priceFrom)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/venues/${v.id}/edit`}
                        className="p-2 text-charcoal/50 hover:text-[#C9A96E] hover:bg-[#C9A96E]/10 rounded-lg transition-colors"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        onClick={() => remove(v.id, v.title)}
                        className="p-2 text-charcoal/50 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function MapPinOff({ className }: { className?: string }) {
  return (
    <svg className={className} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}
