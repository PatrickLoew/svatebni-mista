"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { Search, SlidersHorizontal } from "lucide-react"
import { REGIONS, VENUE_TYPES } from "@/lib/utils"

export default function VenueFilters() {
  const router = useRouter()
  const params = useSearchParams()

  const update = useCallback(
    (key: string, value: string) => {
      const sp = new URLSearchParams(params.toString())
      if (value) sp.set(key, value)
      else sp.delete(key)
      router.push(`/venues?${sp.toString()}`)
    },
    [params, router]
  )

  const selectClass =
    "bg-white border border-[#E8DDD0] rounded-xl px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-[#C9A96E] transition cursor-pointer"

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E8DDD0] p-5 mb-8">
      <div className="flex items-center gap-2 mb-4 text-charcoal/70">
        <SlidersHorizontal size={16} className="text-[#C9A96E]" />
        <span className="font-semibold text-sm">Filtrovat místa</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative lg:col-span-2">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
          <input
            className="w-full bg-white border border-[#E8DDD0] rounded-xl pl-9 pr-4 py-2.5 text-sm text-charcoal placeholder-charcoal/40 focus:outline-none focus:border-[#C9A96E] transition"
            placeholder="Hledat místo nebo lokalitu..."
            defaultValue={params.get("search") ?? ""}
            onChange={(e) => update("search", e.target.value)}
          />
        </div>

        <select
          className={selectClass}
          defaultValue={params.get("region") ?? ""}
          onChange={(e) => update("region", e.target.value)}
        >
          <option value="">Všechny kraje</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>

        <select
          className={selectClass}
          defaultValue={params.get("type") ?? ""}
          onChange={(e) => update("type", e.target.value)}
        >
          <option value="">Všechny typy</option>
          {VENUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <select
          className={selectClass}
          defaultValue={params.get("capacity") ?? ""}
          onChange={(e) => update("capacity", e.target.value)}
        >
          <option value="">Kapacita</option>
          <option value="50">do 50 hostů</option>
          <option value="100">do 100 hostů</option>
          <option value="200">do 200 hostů</option>
          <option value="500">do 500 hostů</option>
        </select>
      </div>

      {params.toString() && (
        <button
          onClick={() => router.push("/venues")}
          className="mt-3 text-xs text-[#C9A96E] hover:underline"
        >
          × Zrušit filtry
        </button>
      )}
    </div>
  )
}
