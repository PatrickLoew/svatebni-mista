/**
 * Autentizace admin sekce.
 *
 * Heslo v env var ADMIN_PASSWORD (jen na serveru).
 * Po správném zadání nastavíme HttpOnly cookie `admin_session` podepsanou HMAC SHA-256.
 * Cookie obsahuje timestamp + HMAC — middleware ji ověří při každém requestu.
 *
 * Bezpečnostní vlastnosti:
 *   - HttpOnly: JS klient ke cookie nemůže
 *   - Secure: posílá se jen přes HTTPS (na produkci)
 *   - SameSite=Lax: chrání před CSRF
 *   - HMAC podpis: cookie nelze padělat bez znalosti SECRET
 *   - Časová expirace: 7 dní
 */
import { createHmac, timingSafeEqual } from "node:crypto"

export const COOKIE_NAME = "admin_session"
export const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60 // 7 dní

/** Secret pro podpis cookie. Použijeme CRON_SECRET (už nastaveno). */
function getSecret(): string {
  const secret = process.env.CRON_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) {
    throw new Error("Chybí CRON_SECRET nebo SUPABASE_SERVICE_ROLE_KEY pro podpis cookie")
  }
  return secret
}

/**
 * Vytvoří podepsanou cookie hodnotu — timestamp.hmac.
 * Timestamp = ms epoch, abychom mohli ověřit expiraci a invalidovat staré cookies.
 */
export function signSession(timestamp: number): string {
  const hmac = createHmac("sha256", getSecret())
  hmac.update(String(timestamp))
  return `${timestamp}.${hmac.digest("hex")}`
}

/**
 * Ověří podpis cookie a vrátí true, pokud je validní A neexpirovaný.
 * Používá timingSafeEqual proti timing attacks.
 */
export function verifySession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false
  const parts = cookieValue.split(".")
  if (parts.length !== 2) return false
  const [tsStr, signature] = parts
  const timestamp = Number(tsStr)
  if (!Number.isFinite(timestamp)) return false

  // Kontrola expirace
  const ageMs = Date.now() - timestamp
  if (ageMs < 0 || ageMs > COOKIE_MAX_AGE_SECONDS * 1000) return false

  // Kontrola podpisu
  const expected = createHmac("sha256", getSecret()).update(tsStr).digest("hex")
  const sigBuf = Buffer.from(signature, "hex")
  const expBuf = Buffer.from(expected, "hex")
  if (sigBuf.length !== expBuf.length) return false
  return timingSafeEqual(sigBuf, expBuf)
}

/**
 * Ověří heslo zadané v login formuláři proti ADMIN_PASSWORD env.
 * Používá timing-safe porovnání aby útočník nemohl odhalit heslo postupně.
 */
export function verifyPassword(password: string): boolean {
  const correct = process.env.ADMIN_PASSWORD
  if (!correct) return false
  const a = Buffer.from(password)
  const b = Buffer.from(correct)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
