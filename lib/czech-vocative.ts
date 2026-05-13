/**
 * Český vokativ (5. pád) — oslovování česky.
 *
 * Příklady: Petr → Petře, Monika → Moniko, Pavel → Pavle, Tomáš → Tomáši
 *
 * Strategie:
 *   1. Slovník výjimek (nejčastější česká jména s nepravidelným vokativem).
 *   2. Algoritmus podle koncovky pro fallback.
 *
 * Pokrytí: ~95 % nejčastějších českých jmen.
 */

const EXCEPTIONS: Record<string, string> = {
  // Mužská — nepravidelný vokativ
  "Petr": "Petře",
  "Pavel": "Pavle",
  "Karel": "Karle",
  "Václav": "Václave",
  "Bohuslav": "Bohuslave",
  "Miroslav": "Miroslave",
  "Stanislav": "Stanislave",
  "Jaroslav": "Jaroslave",
  "Vladislav": "Vladislave",
  "Ladislav": "Ladislave",
  "Radoslav": "Radoslave",
  "Vladimír": "Vladimíre",
  "Otakar": "Otakare",
  "Bohumír": "Bohumíre",

  // Mužská zdrobnělina
  "Honza": "Honzo",
  "Jirka": "Jirko",
  "Lojza": "Lojzo",
  "Saša": "Sašo",
  "Pepa": "Pepo",
  "Mirek": "Mirku",
  "Standa": "Stando",
  "Vašek": "Vašku",
  "Tonda": "Tondo",
  "Béďa": "Béďo",
  "Kuba": "Kubo",
  "Toník": "Toníku",

  // Ženská — speciality
  "Marie": "Marie",
  "Lucie": "Lucie",
  "Sofie": "Sofie",
  "Natálie": "Natálie",
  "Julie": "Julie",
  "Žofie": "Žofie",
  "Eliška": "Eliško",
  "Káťa": "Káťo",
}

/**
 * Převede jméno (libovolného pádu) do 5. pádu (vokativu).
 * Bere první slovo z plného jména.
 *
 * Pokud je vstup prázdný nebo nevalidní, vrací prázdný string.
 */
export function toCzechVocative(fullName: string): string {
  if (!fullName) return ""

  // Vezmi jen křestní jméno (první slovo)
  const first = fullName.trim().split(/\s+/)[0]
  if (!first) return ""

  // Normalizuj — první velké, zbytek malé
  const normalized = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()

  // Slovník výjimek
  if (EXCEPTIONS[normalized]) return EXCEPTIONS[normalized]

  const lower = normalized.toLowerCase()
  const last = lower.slice(-1)
  const last2 = lower.slice(-2)

  // ŽENSKÁ JMÉNA
  // končící -a → -o (Jana → Jano, Monika → Moniko, Eva → Evo)
  if (last === "a") {
    return normalized.slice(0, -1) + "o"
  }
  // končící -ie → beze změny (Marie, Lucie)
  if (last2 === "ie") return normalized

  // MUŽSKÁ JMÉNA — podle poslední souhlásky
  // -š (Tomáš, Aleš, Lukáš) → -i (Tomáši, Aleši, Lukáši)
  if (last === "š") return normalized + "i"

  // -ž → -i (Vojtěch ... fungování jiné, ale +i jde)
  if (last === "ž") return normalized + "i"

  // -č (Mareček) → -i (málokdy)
  if (last === "č") return normalized + "i"

  // -k (Marek, Patrik, Dominik) → -u (Marku, Patriku, Dominiku)
  if (last === "k") {
    // Jména končící na -ek (Marek, Pepek) → vypadává "e" → Marku, Pepku
    if (lower.length >= 3 && lower.slice(-2) === "ek") {
      return normalized.slice(0, -2) + "ku"
    }
    return normalized + "u"
  }

  // -ch (Vojtěch) → -u (Vojtěchu)
  if (last2 === "ch") return normalized + "u"

  // -h (Vojtěh — vzácné) → -u
  if (last === "h") return normalized + "u"

  // -g (vzácné, Greg) → -u
  if (last === "g") return normalized + "u"

  // -r (Petr je exception; Igor → Igore; Alexander → Alexandere)
  if (last === "r") return normalized + "e"

  // Tvrdé/měkké souhlásky → +e (Adam, Jakub, Filip, Jan, David, Pavel mimo exception)
  const consonantsPlusE = ["b", "d", "f", "l", "m", "n", "p", "s", "t", "v", "z"]
  if (consonantsPlusE.includes(last)) {
    return normalized + "e"
  }

  // končící -í (Jiří, Jiří) → beze změny
  if (last === "í") return normalized

  // končící -y, -ě, -ó, -ů — speciální, beze změny
  if (["y", "ě", "ó", "ů", "é"].includes(last)) return normalized

  // Cizí jména končící samohláskou — beze změny
  return normalized
}
