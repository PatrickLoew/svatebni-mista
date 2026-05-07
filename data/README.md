# Import dat svatebních míst

## Jak naimportovat všechny tvé venues z Google Forms

### Krok 1: Stáhni CSV z Google Forms / Sheets
- V Google Sheets: **Soubor → Stáhnout → Hodnoty oddělené čárkami (.csv)**
- Ulož jako `data/venues.csv` (přímo do tohoto adresáře)

### Krok 2: Nastav Supabase env proměnné
V `.env.local` musí být:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhb...
```

### Krok 3: Spusť import
```bash
npm run import-venues
```

Skript:
- Přečte tvůj CSV
- Pro každý řádek vytvoří záznam v tabulce `venues`
- Použije `slug` jako unikátní klíč → můžeš spustit vícekrát, aktualizace přepíšou stará data
- Vypíše ✅ pro každé úspěšně importované místo

### Co skript automaticky převádí

| Sloupec CSV | Pole v DB | Inteligentní mapování |
|-------------|-----------|----------------------|
| Jméno místa | `title`, `slug` | Vytvoří URL slug |
| E-mail | `contact_email` | — |
| Lokalita - Kraj | `region` | "Středočeský kraj" → "Středočeský" |
| Lokalita do 90 minut | `nearest_city` | "od Prahy" → "Praha" |
| Kapacita | `capacity` | "do 80" → 80, "nad 150" → 200 |
| Architektonický typ | `type` | "Mlýn, stodola" → "Venkovský statek" |
| Ubytování | `accommodation_capacity` | "Ano nad 50 osob" → 50 |
| Catering a pití | `catering_policy` | own_free / own_drinks_free / only_venue / negotiable |
| Večerní party | `night_party_policy` | no_curfew / indoor_after_22 / quiet_hours |
| Přidané hodnoty | `features[]` | Rozdělí na položky |
| Pronájem | `price_from` | "do 70.000,-" → 70000 |
| Průměrná cena | `avg_wedding_cost` | — |

### Re-import
Skript je idempotentní — můžeš ho spustit znovu po editaci CSV. Stará místa se aktualizují podle slugu.
