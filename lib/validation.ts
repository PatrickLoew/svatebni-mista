/**
 * Validace formulářových polí.
 * Vrací string s chybou nebo "" když je hodnota OK.
 */

export function validateEmail(email: string): string {
  const trimmed = email.trim()
  if (!trimmed) return "E-mail je povinný"
  // RFC 5322 zjednodušený regex — vyžaduje text@text.tld (min. 2 znaky TLD)
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!re.test(trimmed)) return "Zadejte platný e-mail (např. jana@email.cz)"
  if (trimmed.length > 100) return "E-mail je příliš dlouhý"
  return ""
}

export function validatePhone(phone: string, required = true): string {
  const trimmed = phone.trim()
  if (!trimmed) return required ? "Telefon je povinný" : ""
  // Odstraň mezery, pomlčky, závorky a plus pro počet číslic
  const digitsOnly = trimmed.replace(/[\s\-()+/]/g, "")
  if (!/^\d+$/.test(digitsOnly)) return "Telefon může obsahovat pouze čísla, mezery, +, - a ()"
  // CZ/SK formát: 9 číslic s předvolbou nebo bez
  if (digitsOnly.length < 9) return "Telefon musí mít alespoň 9 číslic"
  if (digitsOnly.length > 15) return "Telefon je příliš dlouhý"
  return ""
}

export function validateName(name: string, required = true): string {
  const trimmed = name.trim()
  if (!trimmed) return required ? "Jméno je povinné" : ""
  if (trimmed.length < 2) return "Jméno je příliš krátké"
  if (trimmed.length > 100) return "Jméno je příliš dlouhé"
  // Aspoň jedno slovo s víc než 1 znakem
  if (!/[a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]{2,}/.test(trimmed)) {
    return "Jméno musí obsahovat písmena"
  }
  return ""
}

/**
 * Hezky naformátuje telefon při vstupu.
 * "722123456" → "722 123 456"
 * "+420722123456" → "+420 722 123 456"
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, "")
  // S předvolbou
  const withPrefix = cleaned.match(/^(\+?\d{3})(\d{3})(\d{3})(\d{3})$/)
  if (withPrefix) return `+${withPrefix[1]} ${withPrefix[2]} ${withPrefix[3]} ${withPrefix[4]}`
  // Bez předvolby (9 číslic)
  const noPrefix = cleaned.match(/^(\d{3})(\d{3})(\d{3})$/)
  if (noPrefix) return `${noPrefix[1]} ${noPrefix[2]} ${noPrefix[3]}`
  return phone
}
