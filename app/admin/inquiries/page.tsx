"use client"

import { useEffect, useState } from "react"
import { formatDate, INQUIRY_STATUSES } from "@/lib/utils"
import type { Inquiry } from "@/lib/types"
import { Trash2 } from "lucide-react"

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    fetch("/api/inquiries").then((r) => r.json()).then(setInquiries).finally(() => setLoading(false))
  }, [])

  async function changeStatus(id: string, status: string) {
    await fetch(`/api/inquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, status: status as Inquiry["status"] } : i)))
  }

  async function remove(id: string) {
    if (!confirm("Smazat poptávku?")) return
    await fetch(`/api/inquiries/${id}`, { method: "DELETE" })
    setInquiries((prev) => prev.filter((i) => i.id !== id))
  }

  const filtered = filter === "all" ? inquiries : inquiries.filter((i) => i.status === filter)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold mb-1">Poptávky</h1>
          <p className="text-charcoal/60 text-sm">{inquiries.length} celkem</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[["all", "Všechny"], ...Object.entries(INQUIRY_STATUSES).map(([k, v]) => [k, v.label])].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
              filter === key ? "bg-[#C9A96E] text-white" : "bg-white border border-[#E8DDD0] text-charcoal/60 hover:border-[#C9A96E]"
            }`}
          >
            {label}
            {key !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({inquiries.filter((i) => i.status === key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-charcoal/50">
          <p className="text-4xl mb-4">📬</p>
          <p>Žádné poptávky v této kategorii.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inq) => {
            const statusInfo = INQUIRY_STATUSES[inq.status]
            return (
              <div key={inq.id} className="bg-white rounded-2xl border border-[#E8DDD0] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-charcoal">{inq.name}</span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="text-sm text-charcoal/60 space-y-0.5">
                      <div>{inq.email} · {inq.phone}</div>
                      <div>
                        <strong className="text-charcoal/80">Místo:</strong> {inq.venueName} ·{" "}
                        <strong className="text-charcoal/80">Datum:</strong> {inq.weddingDate} ·{" "}
                        <strong className="text-charcoal/80">Hostů:</strong> {inq.guests}
                      </div>
                      {inq.message && <div className="text-charcoal/50 italic truncate max-w-lg">"{inq.message}"</div>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={inq.status}
                      onChange={(e) => changeStatus(inq.id, e.target.value)}
                      className="text-sm border border-[#E8DDD0] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#C9A96E] bg-white"
                    >
                      {Object.entries(INQUIRY_STATUSES).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                    <button onClick={() => remove(inq.id)}
                      className="p-2 text-charcoal/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[#E8DDD0] text-xs text-charcoal/40">
                  Přijato: {formatDate(inq.createdAt)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
