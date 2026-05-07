"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, CheckCircle, Loader2 } from "lucide-react"

interface Props {
  venueId: string
  venueName: string
}

export default function InquiryForm({ venueId, venueName }: Props) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", weddingDate: "", guests: "", message: "",
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, venueId, guests: Number(form.guests) }),
      })
      if (!res.ok) throw new Error()
      setSuccess(true)
    } catch {
      setError("Nepodařilo se odeslat poptávku. Zkuste to prosím znovu.")
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    "w-full bg-white border border-[#E8DDD0] rounded-xl px-4 py-3 text-sm text-charcoal placeholder-charcoal/40 focus:outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition"

  return (
    <div className="bg-[#F9F6F0] rounded-2xl p-6 border border-[#E8DDD0] shadow-sm">
      <h3 className="font-display text-xl font-semibold mb-1">Nezávazná poptávka</h3>
      <p className="text-charcoal/60 text-sm mb-5">Pro: <strong>{venueName}</strong></p>

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: .9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h4 className="font-semibold text-lg mb-2">Poptávka odeslána!</h4>
            <p className="text-charcoal/60 text-sm">Ozveme se vám do 24 hodin.</p>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input className={inputClass} placeholder="Jméno a příjmení *" value={form.name} onChange={set("name")} required />
              <input className={inputClass} type="email" placeholder="E-mail *" value={form.email} onChange={set("email")} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className={inputClass} placeholder="Telefon *" value={form.phone} onChange={set("phone")} required />
              <input className={inputClass} type="number" placeholder="Počet hostů *" value={form.guests} onChange={set("guests")} min={1} required />
            </div>
            <div>
              <label className="block text-xs text-charcoal/60 mb-1 ml-1">Datum svatby *</label>
              <input className={inputClass} type="date" value={form.weddingDate} onChange={set("weddingDate")} required min={new Date().toISOString().split("T")[0]} />
            </div>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="Vaše zpráva (nepovinné)..."
              value={form.message}
              onChange={set("message")}
            />

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C9A96E] text-white font-semibold py-3.5 rounded-xl hover:bg-[#A88240] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {loading ? "Odesílám..." : "Odeslat poptávku"}
            </button>

            <p className="text-center text-charcoal/40 text-xs">Vaše údaje jsou v bezpečí. Žádný spam.</p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
