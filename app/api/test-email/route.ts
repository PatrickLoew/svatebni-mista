/**
 * Test endpoint pro diagnostiku Resend e-mailů.
 *
 * GET /api/test-email
 *   → Vrátí stav env vars + zkusí poslat test e-mail.
 *   → Bezpečné: ukazuje jen prvních 8 znaků klíče.
 */
import { NextResponse } from "next/server"

export async function GET() {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL
  const toEmail = process.env.RESEND_TO_EMAIL

  const status = {
    env: {
      RESEND_API_KEY: apiKey
        ? `${apiKey.substring(0, 8)}...(${apiKey.length} znaků)`
        : "❌ CHYBÍ",
      RESEND_FROM_EMAIL: fromEmail ?? "❌ CHYBÍ",
      RESEND_TO_EMAIL: toEmail ?? "❌ CHYBÍ",
    },
    test: null as null | object,
  }

  if (!apiKey || !fromEmail || !toEmail) {
    return NextResponse.json({
      ...status,
      error: "Nějaký env var chybí — nemůžu poslat test e-mail.",
    }, { status: 400 })
  }

  try {
    const { Resend } = await import("resend")
    const resend = new Resend(apiKey)
    const result = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: "TEST: Svatební Místa.cz — diagnostika",
      html: `
        <div style="font-family:Helvetica,Arial,sans-serif;padding:20px">
          <h2>Test e-mail funguje! 🎉</h2>
          <p>Pokud čteš tento mail, Resend integration je správně nastavená.</p>
          <p><strong>From:</strong> ${fromEmail}</p>
          <p><strong>To:</strong> ${toEmail}</p>
          <p><strong>Čas:</strong> ${new Date().toLocaleString("cs-CZ")}</p>
        </div>
      `,
    })

    status.test = result
    if (result.error) {
      return NextResponse.json({
        ...status,
        error: result.error,
        hint: result.error.message?.includes("forbidden") || result.error.message?.includes("only")
          ? "Resend free tier: posílat lze JEN na e-mail, kterým jsi se zaregistroval. Ověř doménu nebo použij stejný e-mail."
          : undefined,
      }, { status: 500 })
    }

    return NextResponse.json({
      ...status,
      success: true,
      message: `E-mail odeslán na ${toEmail}. Zkontroluj schránku (+ spam) za 1 minutu.`,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({
      ...status,
      error: msg,
    }, { status: 500 })
  }
}
