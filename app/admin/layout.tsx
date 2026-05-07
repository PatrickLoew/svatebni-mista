"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, MapPin, MessageSquare, Settings, LogOut, Menu, X } from "lucide-react"

const nav = [
  { href: "/admin", label: "Přehled", icon: LayoutDashboard },
  { href: "/admin/venues", label: "Místa", icon: MapPin },
  { href: "/admin/inquiries", label: "Poptávky", icon: MessageSquare },
  { href: "/admin/settings", label: "Nastavení", icon: Settings },
]

function AuthGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState("")
  const [err, setErr] = useState(false)

  useEffect(() => {
    setAuthed(sessionStorage.getItem("admin_auth") === "1")
  }, [])

  if (authed) return <>{children}</>

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-6">
      <div className="bg-white rounded-2xl p-10 w-full max-w-sm shadow-2xl text-center">
        <div className="text-[#C9A96E] text-3xl mb-4">✦</div>
        <h1 className="font-display text-2xl font-semibold mb-1">Admin přístup</h1>
        <p className="text-charcoal/60 text-sm mb-6">Zadejte heslo pro přístup do administrace</p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (pw === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "admin123")) {
              sessionStorage.setItem("admin_auth", "1")
              setAuthed(true)
            } else setErr(true)
          }}
        >
          <input
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setErr(false) }}
            placeholder="Heslo"
            className={`w-full border ${err ? "border-red-400" : "border-[#E8DDD0]"} rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:border-[#C9A96E]`}
          />
          {err && <p className="text-red-500 text-xs mb-3">Nesprávné heslo</p>}
          <button className="w-full bg-[#C9A96E] text-white font-semibold py-3 rounded-xl hover:bg-[#A88240] transition-colors">
            Přihlásit se
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <AuthGate>
      <div className="min-h-screen bg-[#F9F6F0] flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-60 bg-[#0A0A0A] text-white flex flex-col transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        >
          <div className="px-6 py-6 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-[#C9A96E] text-xl">✦</span>
              <span className="font-display font-semibold">Admin panel</span>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {nav.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#C9A96E] text-white"
                      : "text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-white/10">
            <button
              onClick={() => { sessionStorage.removeItem("admin_auth"); location.reload() }}
              className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors w-full px-4 py-2"
            >
              <LogOut size={14} /> Odhlásit se
            </button>
            <Link href="/" className="block text-center text-xs text-white/30 hover:text-white/60 mt-2 transition-colors">
              ← Zpět na web
            </Link>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main */}
        <div className="flex-1 lg:ml-60 flex flex-col">
          <header className="bg-white border-b border-[#E8DDD0] px-6 py-4 flex items-center gap-4">
            <button className="lg:hidden text-charcoal" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <h2 className="font-semibold text-charcoal">
              {nav.find((n) => n.href === pathname)?.label ?? "Admin"}
            </h2>
          </header>
          <main className="flex-1 p-6 max-w-6xl mx-auto w-full">{children}</main>
        </div>
      </div>
    </AuthGate>
  )
}
