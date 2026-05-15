/**
 * Globální proxy (Next.js 16 přejmenoval middleware → proxy).
 * Chrání admin sekci před neautorizovaným přístupem.
 *
 * Bez platné cookie `admin_session` přesměruje na /admin/login.
 * Veřejné endpointy (/api/admin/login, /api/admin/logout) jsou výjimky.
 * Cron endpoint /api/sync-sheet má svou Bearer auth.
 *
 * POZOR: proxy běží v Edge Runtime — nemůžeme používat node:crypto.
 * Použijeme Web Crypto API pro HMAC verifikaci.
 */
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const COOKIE_NAME = "admin_session"
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 dní

/** Cesty, které vyžadují přihlášení. */
const PROTECTED_PATHS = [
  "/admin",        // všechny /admin/* kromě /admin/login
  "/api/venues",   // CRUD místa
  "/api/inquiries/", // úpravy konkrétní poptávky (PATCH/DELETE), ne GET listu
  "/api/settings", // PUT settings
  "/api/upload-image",
  "/api/admin/trigger-sync",
]

/** Cesty, které jsou veřejné i v "protected" prefixu. */
const PUBLIC_EXCEPTIONS = [
  "/admin/login",
  "/api/admin/login",
  "/api/admin/logout",
]

/**
 * Web Crypto verifikace HMAC SHA-256 (kompatibilní s Edge Runtime).
 */
async function verifySessionEdge(
  cookieValue: string | undefined,
  secret: string,
): Promise<boolean> {
  if (!cookieValue || !secret) return false
  const parts = cookieValue.split(".")
  if (parts.length !== 2) return false
  const [tsStr, signatureHex] = parts
  const timestamp = Number(tsStr)
  if (!Number.isFinite(timestamp)) return false

  // Kontrola expirace
  const age = Date.now() - timestamp
  if (age < 0 || age > COOKIE_MAX_AGE_MS) return false

  // Vypočti očekávaný HMAC
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sigBuf = await crypto.subtle.sign("HMAC", key, encoder.encode(tsStr))
  const expectedHex = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  // Timing-safe porovnání (manuální, Edge nemá timingSafeEqual)
  if (expectedHex.length !== signatureHex.length) return false
  let diff = 0
  for (let i = 0; i < expectedHex.length; i++) {
    diff |= expectedHex.charCodeAt(i) ^ signatureHex.charCodeAt(i)
  }
  return diff === 0
}

function isProtected(pathname: string): boolean {
  // Veřejná výjimka má přednost
  if (PUBLIC_EXCEPTIONS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return false
  }
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p))
}

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  if (!isProtected(pathname)) {
    return NextResponse.next()
  }

  const secret = process.env.CRON_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) {
    // Bez secretu nemůžeme ověřit — nepouštíme nikoho
    return new NextResponse("Server není nakonfigurován (chybí CRON_SECRET)", { status: 500 })
  }

  const cookie = req.cookies.get(COOKIE_NAME)?.value
  const valid = await verifySessionEdge(cookie, secret)

  if (valid) {
    return NextResponse.next()
  }

  // /admin/* → redirect na login s parametrem ?from=
  if (pathname.startsWith("/admin")) {
    const loginUrl = new URL("/admin/login", req.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // /api/* → vraťme JSON 401
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

/**
 * Matcher: proxy se spouští jen na cestách, které potřebují kontrolu.
 * Public files (_next, favicon, ...) jsou vyloučené automaticky.
 */
export const config = {
  matcher: [
    "/admin/:path*",
    "/api/venues/:path*",
    "/api/inquiries/:path*",
    "/api/settings/:path*",
    "/api/upload-image/:path*",
    "/api/admin/:path*",
  ],
}
