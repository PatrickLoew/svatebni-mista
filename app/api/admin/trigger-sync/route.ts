/**
 * Admin proxy pro /api/sync-sheet.
 *
 * Spustí sync-sheet s CRON_SECRET, takže admin tlačítko nemusí znát token.
 * Volá se z /admin pomocí fetch.
 */
import { NextResponse } from "next/server"

export async function POST() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
    "http://localhost:3000"

  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET není nastaven v env" },
      { status: 500 },
    )
  }

  try {
    const res = await fetch(`${baseUrl}/api/sync-sheet`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
