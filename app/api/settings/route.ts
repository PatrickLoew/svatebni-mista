import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getSettings, updateSettings } from "@/lib/settings"

export async function GET() {
  const s = await getSettings()
  return NextResponse.json(s)
}

export async function PUT(req: Request) {
  const body = await req.json()
  const result = await updateSettings(body)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })

  // Po uložení texty znova vygenerujeme všechny stránky které settings používají.
  // Tím se změny okamžitě propíšou na produkční web bez čekání na cache.
  revalidatePath("/")
  revalidatePath("/chci-svatbu")
  revalidatePath("/venues")

  return NextResponse.json({ ok: true })
}
