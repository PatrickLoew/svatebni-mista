"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, Lock } from "lucide-react"

/**
 * Login stránka pro administraci.
 * Zadání hesla → POST /api/admin/login → redirect zpět (?from=) nebo /admin.
 *
 * useSearchParams vyžaduje v Next.js 16 Suspense boundary (CSR bailout).
 */
export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FEFDFB] via-[#F9F2E6] to-[#F0E8DC]">
      <Loader2 size={28} className="animate-spin text-[#C9A96E]" />
    </div>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Přihlášení selhalo")
        return
      }
      // Redirect na původně požadovanou stránku (?from=) nebo /admin
      const from = searchParams.get("from") ?? "/admin"
      router.replace(from)
      router.refresh()
    } catch {
      setError("Nepodařilo se připojit k serveru")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FEFDFB] via-[#F9F2E6] to-[#F0E8DC] px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-[#E8DDD0] p-8"
      >
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-full bg-[#C9A96E]/15 items-center justify-center mb-4">
            <Lock size={22} className="text-[#C9A96E]" />
          </div>
          <h1 className="font-serif text-2xl font-light text-[#3E2723] mb-1">
            Administrace
          </h1>
          <p className="text-charcoal/60 text-sm">
            Svatební Místa.cz
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wider mb-2">
            Heslo
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
            className="w-full bg-white border-2 border-[#E8DDD0] rounded-xl px-4 py-3 text-base text-[#2C2C2C] focus:outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition"
            placeholder="Zadejte heslo"
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm text-center mb-4 p-3 bg-red-50 rounded-xl border border-red-200">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          className="w-full bg-[#3E2723] text-white font-semibold py-3.5 rounded-xl hover:bg-[#1F1310] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
          {loading ? "Přihlašuji…" : "Přihlásit se"}
        </button>

        <p className="text-charcoal/40 text-xs text-center mt-6">
          Pro reset hesla kontaktujte správce projektu.
        </p>
      </form>
    </div>
  )
}
