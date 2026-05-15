/**
 * POST /api/admin/login — přihlášení do administrace.
 *
 * Body: { password: string }
 * Při úspěchu: nastaví HttpOnly cookie `admin_session` a vrátí { ok: true }.
 * Při neúspěchu: 401 Unauthorized.
 */
import { NextResponse } from "next/server"
import {
  COOKIE_NAME,
  COOKIE_MAX_AGE_SECONDS,
  signSession,
  verifyPassword,
} from "@/lib/admin-auth"

export async function POST(req: Request) {
  let body: { password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Neplatný formát požadavku" }, { status: 400 })
  }

  const password = body.password ?? ""

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD není nastaveno na serveru. Nastav v Environment Variables." },
      { status: 500 },
    )
  }

  // Malá pauza proti brute-force (300 ms je nepostřehnutelné pro lidi, ale zpomalí útoky)
  await new Promise((r) => setTimeout(r, 300))

  if (!verifyPassword(password)) {
    return NextResponse.json({ error: "Nesprávné heslo" }, { status: 401 })
  }

  const session = signSession(Date.now())
  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  })
  return response
}
