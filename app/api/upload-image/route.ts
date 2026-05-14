import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

/**
 * Upload obrázku do Supabase Storage.
 *
 * POST /api/upload-image
 * Body: FormData s field "file"
 *
 * Response: { url: "https://..." }
 *
 * Vyžaduje: bucket "venue-images" v Supabase Storage (public).
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Chybí soubor" }, { status: 400 })
    }

    // Validace typu (jen obrázky)
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: `Nepodporovaný typ: ${file.type}. Povolené: JPG, PNG, WebP, GIF.` },
        { status: 400 },
      )
    }

    // Validace velikosti (max 10 MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: `Soubor je moc velký (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum je 10 MB.` },
        { status: 400 },
      )
    }

    // Vygeneruj unikátní název souboru
    const ext = file.name.split(".").pop() ?? "jpg"
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`

    // Nahrání
    const buffer = await file.arrayBuffer()
    const { data, error } = await supabaseAdmin.storage
      .from("venue-images")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error("Upload error:", error)
      // Detailnější chybové hlášení pro běžné případy
      let hint = ""
      if (error.message.includes("Bucket not found")) {
        hint = " Vytvoř bucket 'venue-images' v Supabase Storage."
      } else if (error.message.includes("policy") || error.message.includes("RLS")) {
        hint = " RLS policy: použij Service Role Key (SUPABASE_SERVICE_ROLE_KEY musí být na Vercelu)."
      }
      return NextResponse.json({ error: error.message + hint }, { status: 500 })
    }

    // Public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("venue-images")
      .getPublicUrl(data.path)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("Upload route error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
