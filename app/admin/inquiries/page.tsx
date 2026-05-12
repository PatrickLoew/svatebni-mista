"use client"

import { useEffect, useState } from "react"
import { formatDate, INQUIRY_STATUSES } from "@/lib/utils"
import type { Inquiry } from "@/lib/types"
import { Trash2, ChevronDown, Mail, Phone } from "lucide-react"

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/inquiries")
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}))
          throw new Error(err.hint || err.error || `HTTP ${r.status}`)
        }
        return r.json()
      })
      .then((data) => {
        if (Array.isArray(data)) setInquiries(data)
        else throw new Error("Neočekávaná odpověď z API")
      })
      .catch((e) => setErrorMsg(e.message ?? String(e)))
      .finally(() => setLoading(false))
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

      {errorMsg && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm">
          <p className="font-semibold text-red-800 mb-1">Nepodařilo se načíst poptávky</p>
          <p className="text-red-700 mb-2">{errorMsg}</p>
          <p className="text-red-600/80 text-xs">
            Tip: ověř na Vercelu, že máš nastavený <code className="bg-white px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code>.
            Pak zkus <strong>Redeploy</strong>.
          </p>
        </div>
      )}

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
              <div key={inq.id} className="bg-white rounded-2xl border border-[#E8DDD0] overflow-hidden">
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="font-semibold text-charcoal text-base">{inq.name}</span>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        {inq.message?.includes("[KONZULTACE]") && (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#C9A96E]/15 text-[#A88240]">
                            Konzultace
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-charcoal/70 space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <a href={`mailto:${inq.email}`} className="flex items-center gap-1 hover:text-[#C9A96E]">
                            <Mail size={13} /> {inq.email}
                          </a>
                          {inq.phone && inq.phone !== "—" && (
                            <a href={`tel:${inq.phone}`} className="flex items-center gap-1 hover:text-[#C9A96E]">
                              <Phone size={13} /> {inq.phone}
                            </a>
                          )}
                        </div>
                        <div className="text-xs">
                          {inq.weddingDate && <><strong>Termín:</strong> {inq.weddingDate} · </>}
                          {inq.guests > 0 && <><strong>Hostů:</strong> {inq.guests}</>}
                        </div>
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

                  {/* Toggle detail */}
                  {inq.message && (
                    <button
                      onClick={() => setExpandedId(expandedId === inq.id ? null : inq.id)}
                      className="mt-3 flex items-center gap-1 text-xs text-[#C9A96E] hover:text-[#A88240] font-medium"
                    >
                      <ChevronDown size={14} className={`transition-transform ${expandedId === inq.id ? "rotate-180" : ""}`} />
                      {expandedId === inq.id ? "Skrýt detail" : "Zobrazit detail (odpovědi wizardu)"}
                    </button>
                  )}

                  <div className="mt-3 pt-3 border-t border-[#E8DDD0] text-xs text-charcoal/40">
                    Přijato: {formatDate(inq.createdAt)}
                  </div>
                </div>

                {/* Detail rozbalený */}
                {expandedId === inq.id && inq.message && (
                  <div className="bg-[#F9F2E6]/40 border-t border-[#E8DDD0] p-5">
                    <p className="text-xs font-semibold text-[#A88240] tracking-wider uppercase mb-3">
                      Detail poptávky (odpovědi z wizardu)
                    </p>
                    <pre className="whitespace-pre-wrap text-sm text-charcoal/80 font-sans leading-relaxed">{inq.message}</pre>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
