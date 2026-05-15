@AGENTS.md

# Svatební Místa.cz — kompletní dokumentace projektu

> **Pro budoucí Claude sessions:** Přečti si tento soubor jako první, abys porozuměl tomu, co tu už je hotové.

---

## 🎯 Co tato aplikace dělá

Webová služba, kde klient vyplní wizard se 7 otázkami o své svatbě (kraj, hosté, rozpočet, catering, party, atd.) a **Claude Sonnet 4.5** mu vybere **5 nejlepších svatebních míst** z databáze ~200 míst. Klient dostane e-mail s návrhem.

**USP:** „Jediná služba v ČR, která Vám podle Vašich kritérií vybere svatební místo na míru."

---

## 🛠 Technický stack

- **Next.js 16** (App Router, Server Components, React 19)
- **Supabase** (PostgreSQL + Storage pro fotky)
- **Anthropic Claude Sonnet 4.5** (AI vyhodnocování)
- **Resend** (transakční e-maily)
- **Tailwind CSS 4** (žádné UI knihovny)
- **Framer Motion** (animace, jen na vybraných místech)
- **Vercel** (hosting + Cron Jobs)
- **TypeScript** (strict)

---

## 📂 Klíčové soubory a logika

### AI vyhodnocování
- `lib/claude-ai.ts` — system prompt + volání Claude (Sonnet 4.5)
- `lib/wedding-evaluation-rules.md` — pravidla Monči (case studies)
- `lib/matching.ts` — fallback algoritmus + WizardAnswers typ
- `lib/keyword-matcher.ts` — vyhledávání bazén/psi/wellness/atd. v features
- `lib/geography.ts` — mapa „od X do 90 min = jaké kraje"
- `lib/venue-mapping.ts` — single source of truth pro DB → UI mapping
- `lib/venue-policies.ts` — pretty-print catering/party/ubytování
- `lib/czech-vocative.ts` — Petr→Petře, Monika→Moniko (5. pád)

### Hlavní API
- `app/api/match/route.ts` — wizard submission, AI vyhodnocení, posílá e-maily
- `app/api/inquiries/route.ts` — poptávka z detailu místa
- `app/api/consultation/route.ts` — konzultační formulář
- `app/api/sync-sheet/route.ts` — auto-sync ze Sheets (Vercel Cron)
- `app/api/admin/trigger-sync/route.ts` — proxy pro admin „Synchronizovat teď"
- `app/api/upload-image/route.ts` — upload do Supabase Storage
- `app/api/settings/route.ts` — texty pro homepage (revalidatePath)
- `app/api/venues/route.ts` — CRUD místa
- `app/api/test-email/route.ts` — diagnostika Resendu
- `app/api/upload-image/route.ts` — upload fotek

### Wizard
- `components/wizard/Wizard.tsx` — 7kroků, multi-select, vokativ
- `components/wizard/WizardLoading.tsx` — animace prstýnků, sync s API

### Homepage komponenty
- `components/home/Hero.tsx` — úvod (editovatelný text + background fotka)
- `components/home/Testimonials.tsx` — statistiky + reference
- `components/home/FeaturedVenues.tsx` — 3 VIP karty
- `components/home/Process.tsx` — 3 kroky (editovatelné)
- `components/home/Gallery.tsx` — 6 fotek (editovatelné)
- `components/home/ConsultationCTA.tsx` — kontakty + 2 karty CTA
- `components/home/FAQ.tsx` — 6 Q&A (editovatelné)

### Pořadí sekcí na homepage (`app/page.tsx`)
1. Hero
2. **Testimonials** (Patrik chtěl hned pod Hero)
3. FeaturedVenues
4. MidCTA
5. Process
6. Catering
7. Gallery
8. ConsultationCTA
9. FAQ

### Admin
- `app/admin/page.tsx` — dashboard + tlačítko „Synchronizovat teď"
- `app/admin/settings/page.tsx` — všechny texty + fotky homepage
- `app/admin/venues/page.tsx` — seznam míst
- `app/admin/venues/[id]/edit/page.tsx` — editace místa
- `app/admin/inquiries/page.tsx` — poptávky
- `components/admin/VenueForm.tsx` — formulář pro místo (s upload)

---

## 🤖 AI logika krok za krokem

Když klient odešle wizard (`/api/match`):

1. **Načti všech 194 míst** z Supabase (`mapDbToVenue`)
2. **Keyword match** — extract `specialRequests` → seřaď místa podle shod (bazén/psi/wellness/...)
3. **Volej Claude Sonnet 4.5** s prompt cachingem:
   - System prompt: pravidla z `wedding-evaluation-rules.md`
   - Cacheovaný blok: všech ~200 míst (description, features, services)
   - User prompt: odpovědi klienta
   - Sonnet vrátí 5 míst (primary + alternative)
4. **POST-validace** každého místa:
   - Kapacita ≥ 0,85× hostů
   - V dosažitelném kraji (geography.ts)
   - Cena ≤ 1,2× rozpočet
   - Catering policy (klient `vlastni-vse` × místo `only_venue` = vyloučit)
   - Party policy (klient `velka-bez-klidu` × místo `quiet_hours` = vyloučit)
5. **Force VIP rule** — pokud VIP v dosažitelných krajích chybí v doporučení, **deterministicky** ho přidá
6. **Reprezentace krajů** — pokud klient zadal 2+ kraje, každý musí mít aspoň 1 místo
7. **Absolutní fallback** — pokud po všem < 5 míst, doplní z celé DB
8. **Pošli e-maily** (Resend):
   - Klientovi (5 míst + CTA tlačítka)
   - Firmě (notifikace)
9. **Ulož poptávku** do `inquiries`

**Garance:** Klient VŽDY dostane 5 doporučení (dokud DB má ≥5 míst).

---

## 📧 Email logika (Resend)

### ENV vars (Vercel):
- `RESEND_API_KEY` = `re_…`
- `RESEND_FROM_EMAIL` = `onboarding@resend.dev` (zatím, do ověření domény)
- `RESEND_TO_EMAIL` = `jana@svatebnimista.cz`

### ⚠️ Aktuální omezení:
Resend free tier: posíláme **JEN na e-mail registračního účtu** (`jana@…`). Klient na svůj e-mail nedostane nic, dokud:
- Ověříme doménu `svatebnimista.cz` v Resendu (DNS records)
- Změníme `RESEND_FROM_EMAIL` na `noreply@svatebnimista.cz`

### Co se posílá kdy:
- **Po wizardu** (`/api/match`): klient dostane 5 doporučení, firma notifikaci
- **Po poptávce z detailu místa** (`/api/inquiries POST`): klient potvrzení, firma notifikaci
- **Po konzultaci** (`/api/consultation`): klient potvrzení, firma notifikaci

---

## 🔄 Auto-sync ze Sheets

- **Schedule:** každý den v 6:00 ráno (`vercel.json` — `0 6 * * *`)
- **Endpoint:** `/api/sync-sheet` (GET + POST)
- **Auth:** `Authorization: Bearer ${CRON_SECRET}`
- **Admin tlačítko:** `/admin` → „Synchronizovat teď"
- **Co dělá:** stáhne sheet, updatne non-VIP místa (VIP jsou chráněná z `data/vip-master.csv`), `revalidatePath()` aby se data ihned propsala na web

---

## 🗄 Database (Supabase)

### Tabulky:
- `venues` (194 záznamů, 22 VIP)
- `inquiries` (poptávky z webu)
- `site_settings` (texty + fotky homepage, řádek `id=1`)

### Storage bucket:
- `venue-images` (public) — fotky míst + homepage Gallery + Hero

### Důležité sloupce ve `venues`:
- `is_featured` (VIP flag)
- `region`, `nearest_city` (geografie)
- `catering_policy` (own_free / own_drinks_free / only_venue / negotiable)
- `night_party_policy` (no_curfew / indoor_after_22 / quiet_hours / negotiable)
- `accommodation_capacity` (počet lůžek)
- `features` (JSON pole klíčových slov)

---

## 🖼 Admin features

Co všechno admin může (v `/admin`):

| Funkce | Kde |
|--------|-----|
| Upravit všechny texty na webu | `/admin/settings` |
| Upravit Hero background fotku | `/admin/settings` |
| Upravit 6 fotek galerie | `/admin/settings` |
| Editovat místa | `/admin/venues` |
| Nahrát fotky k místu z disku | `/admin/venues/[id]/edit` |
| Prohlížet poptávky | `/admin/inquiries` |
| Měnit status poptávky | `/admin/inquiries` |
| Smazat poptávku | `/admin/inquiries` |
| Spustit sync ze sheetu | `/admin` |

**Po uložení textů** → `revalidatePath("/")` → změny okamžitě na produkčním webu (max 1–3s).

---

## 🧪 npm scripty (terminál)

```bash
npm run dev                 # dev server (localhost:3000)
npm run build               # produkční build
npm run health-check        # 30+ testů: env, DB, AI, Resend, logika
npm run audit-venues        # diagnostika DB (kolik míst, vyplněnost polí)
npm run sync-sheet          # ruční sync ze Sheets (smaže staré, nahraje nové)
npm run update-from-sheet   # bezpečný update non-VIP (chrání VIP)
npm run update-vip-from-csv # sync VIP z data/vip-master.csv
npm run enrich-vip-from-web # AI scrape webů VIP míst → features
npm run verify-all-venues   # AI ověření region/type/city
npm run verify-all-fields   # AI ověření všech polí včetně catering/party
npm run refresh-venues      # rychlá oprava (bez full sync)
npm run fix-stablovice      # manuální fix konkrétních míst (override)
```

---

## ⚙️ Environment Variables

### Lokálně (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=onboarding@resend.dev
RESEND_TO_EMAIL=jana@svatebnimista.cz
GOOGLE_SHEET_URL=https://docs.google.com/...
```

### Vercel (produkce):
- Vše výše +
- `CRON_SECRET` (libovolný náhodný 64-znakový string)

---

## 🚨 Co dělat když...

### Web pomalu načítá → zkontroluj
- `dynamic = "force-dynamic"` v `app/page.tsx` znamená že se renderuje server-side při každém requestu — to je správně pro admin texty, ale je pomalejší. Pokud chceš rychlejší: `revalidate = 60` (cache 60s)

### AI vrací divné výsledky → diagnostika
1. `npm run audit-venues` — jsou data v DB OK?
2. Vercel Logs → hledej `[match]` zprávy
3. `/api/test-email` — funguje Resend?
4. `npm run health-check` — kompletní test

### Klient nedostal e-mail → 1 z těchto:
- `RESEND_API_KEY` chybí na Vercelu
- Doména `svatebnimista.cz` neověřená v Resendu → free tier omezuje na 1 e-mail
- E-mail klienta není stejný jako `RESEND_TO_EMAIL` (free tier)

### Upload fotky selhává → 1 z těchto:
- Bucket `venue-images` neexistuje
- Bucket není **Public**
- `SUPABASE_SERVICE_ROLE_KEY` chybí na Vercelu

### Místo se neukazuje ve výsledcích → diagnostika
- `npm run audit-venues` — má správný region/kraj/typ?
- Vercel Logs → `[match] FORCE VIP RULE` zprávy
- Možná `nearest_city` špatný (klient z Prahy → musí mít `nearest_city = Praha`)

### Texty se po uložení v adminu nezobrazují → ověř
- `app/page.tsx` má `export const dynamic = "force-dynamic"`
- `/api/settings PUT` volá `revalidatePath("/")`
- Hard refresh prohlížeče (Cmd+Shift+R)

---

## 💡 Pravidla pro Patrika a Mončo

### Patrik pracuje:
- Komunikace **česky**
- Začátečník v programování — vysvětluj **krok za krokem**
- Preferuje **konkrétní instrukce co kde klikat**

### 5 interních expertů (vždy konzultovat):
- **Viktor (CEO)** — strategie, hodnota pro uživatele
- **Martin (CTO)** — technická kvalita, škálovatelnost
- **Radek (krizový)** — co může selhat, edge cases
- **Sarah (externí)** — čerstvý pohled, zdravý rozum
- **Pavel (strážce)** — konzistence, nepřepisovat funkční kód

---

## 📊 Status (poslední kontrola)

```
✓ 194 míst v DB (z toho 22 VIP)
✓ region 100%, nearest_city 100%, type 92%
✓ catering 100%, party 100%, ubytování 84%
✓ features 98% (po enrich-vip-from-web)
✓ Claude Sonnet 4.5 funguje
✓ Resend funguje (omezeno na Janu — doména neověřená)
✓ Auto-sync každý den 6:00
✓ Admin: texty + fotky (Hero, Gallery, místa)
✓ Storage bucket venue-images (public)
✓ Cross-browser (Chrome, Edge, Safari, Firefox)
```

---

## 🔗 Důležité odkazy

- **Produkce:** https://svatebni-mista.vercel.app
- **GitHub:** https://github.com/PatrickLoew/svatebni-mista
- **Supabase:** https://supabase.com/dashboard
- **Vercel:** https://vercel.com/dashboard
- **Resend:** https://resend.com/dashboard

---

*Poslední aktualizace: 15. května 2026*
