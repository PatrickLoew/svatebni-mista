import { NextResponse } from "next/server"
import { getSettings, updateSettings } from "@/lib/settings"

export async function GET() {
  const s = await getSettings()
  return NextResponse.json(s)
}

export async function PUT(req: Request) {
  const body = await req.json()
  const result = await updateSettings(body)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ ok: true })
}
