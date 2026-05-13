/**
 * Geografická pravidla pro dojezdové vzdálenosti.
 *
 * Pokud klient zadá "do 90 min od X", musíme zohlednit, že místo
 * v sousedním kraji blízkém X je BLÍŽE než místo v X kraji dál.
 *
 * Tabulka definuje: pro každé centrum (Praha, Brno, Ostrava...),
 * které kraje jsou DO 90 MIN AUTEM (zhruba 100-130 km).
 */

import type { NearestCity, Region } from "./types"

/**
 * Mapa: centrum → kraje, jejichž větší část je do 90 min autem.
 * Sestaveno na základě reálných tras (Google Maps).
 */
export const REGIONS_WITHIN_90MIN: Record<NearestCity, Region[]> = {
  "Praha": [
    "Praha",
    "Středočeský",
    "Ústecký",        // sever — Litoměřice, Lovosice ~70 km
    "Liberecký",      // jih — Mnichovo Hradiště ~75 km
    "Královéhradecký", // západ — Jičín, Hořice ~100 km
    "Pardubický",     // západ — Chrudim, Pardubice ~115 km
    "Plzeňský",       // sever — Plzeň ~95 km
    "Jihočeský",      // sever — Tábor ~90 km, Písek ~100 km
  ],
  "Brno": [
    "Jihomoravský",
    "Vysočina",       // východ — Žďár, Velké Meziříčí ~70 km
    "Zlínský",        // sever — Uherské Hradiště ~95 km
    "Olomoucký",      // jih — Prostějov, Vyškov ~70 km
    "Pardubický",     // jih — Svitavy ~95 km
  ],
  "Ostrava": [
    "Moravskoslezský",
    "Olomoucký",      // jih a střed — Hranice, Přerov ~70 km, Olomouc ~85 km
    "Zlínský",        // sever — Valašské Meziříčí ~50 km, Vsetín ~85 km
  ],
  "Olomouc": [
    "Olomoucký",
    "Zlínský",        // východ — Hranice ~30 km
    "Moravskoslezský", // sever — Šternberk ~50 km, Bruntál ~80 km
    "Pardubický",     // západ — Mohelnice, Lanškroun ~70 km
    "Jihomoravský",   // jih — Prostějov ~25 km, Brno ~85 km
    "Vysočina",       // jihozápad částečně
  ],
  "Plzeň": [
    "Plzeňský",
    "Karlovarský",    // sever — Toužim ~50 km, Cheb ~95 km
    "Středočeský",    // východ — Rokycany ~25 km, Příbram ~90 km
    "Jihočeský",      // jihovýchod — Strakonice ~65 km
    "Praha",          // východ ~95 km
  ],
  "České Budějovice": [
    "Jihočeský",
    "Vysočina",       // sever — Telč ~80 km, Jihlava ~95 km
    "Plzeňský",       // severozápad — Strakonice ~50 km
    "Středočeský",    // sever — Tábor ~50 km, Benešov ~95 km
  ],
  "Hradec Králové": [
    "Královéhradecký",
    "Pardubický",     // jih — Pardubice ~25 km
    "Liberecký",      // sever — Trutnov ~50 km
    "Středočeský",    // západ — Poděbrady ~50 km, Kolín ~70 km
    "Vysočina",       // jihozápad — Havlíčkův Brod ~80 km
  ],
  "Liberec": [
    "Liberecký",
    "Královéhradecký", // východ — Trutnov ~60 km
    "Ústecký",        // západ — Děčín ~75 km, Česká Lípa ~30 km
    "Středočeský",    // jih — Mladá Boleslav ~70 km
  ],
}

/**
 * Vrátí true, pokud je daný kraj do 90 min autem od daného města.
 * Pokud město nezadané ("jedno"), vrátí true vždy (klient nezadal preferenci).
 */
export function isRegionWithin90Min(region: Region, city: NearestCity | "jedno" | undefined): boolean {
  if (!city || city === "jedno") return true
  const allowed = REGIONS_WITHIN_90MIN[city]
  if (!allowed) return true // neznámé město — netoleruj
  return allowed.includes(region)
}

/**
 * Vrátí kraje, které jsou do 90 min od města klienta.
 * Použito pro Force VIP rule.
 */
export function getAcceptableRegions(
  preferredRegions: Region[],
  nearestCity: NearestCity | "jedno" | undefined,
): Region[] {
  // 1) Pokud klient zadal preferované kraje → použij ty
  if (preferredRegions.length > 0) return preferredRegions
  // 2) Pokud zadal jen město → odvoď kraje
  if (nearestCity && nearestCity !== "jedno") {
    return REGIONS_WITHIN_90MIN[nearestCity] ?? []
  }
  // 3) Nezadáno nic → všechny
  return []
}
