/**
 * Admin proxy pro /api/sync-sheet.
 *
 * Spustí sync-sheet s CRON_SECRET, takže admin tlačítko nemusí znát token.
 * Volá se z /admin pomocí fetch.
 */
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET není nastaven v env. Přidej ho na Vercelu." },
      { status: 500 },
    )
  }

  // Použijeme stejný origin jako přicházející request (vždy funguje)
  const url = new URL(req.url)
  const baseUrl = `${url.protocol}//${url.host}`

  try {
    const res = await fetch(`${baseUrl}/api/sync-sheet`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
    })

    // Pokud sync-sheet vrátil HTML (Vercel error page), zachytíme to gracefully
    const text = await res.text()
    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      return NextResponse.json(
        {
          error: `sync-sheet vrátil neplatný JSON (status ${res.status}). Možná chybí Supabase přístup nebo Google Sheet URL.`,
          preview: text.substring(0, 200),
        },
        { status: 500 },
      )
    }
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Fetch error: ${msg}` }, { status: 500 })
  }
}
