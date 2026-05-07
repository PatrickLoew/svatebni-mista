# Svatební Místa.cz

Prémiová full-stack aplikace pro svatební agenturu — katalog míst, poptávky, admin panel a wedding planning.

## Tech stack
- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS 4**
- **Framer Motion** (animace, scroll reveal, parallax)
- **Supabase** (PostgreSQL databáze)
- **Resend** (e-mailové notifikace, volitelné)
- **Lucide React** (ikony)
- Cormorant Garamond + Geist (editorial typografie)

## Spuštění (krok za krokem)

### 1. Závislosti jsou již nainstalované
Pokud potřebuješ reinstall:
```bash
cd svatebni-mista
npm install
```

### 2. Nastav environment proměnné
```bash
cp .env.example .env.local
```
A vyplň hodnoty z tvého Supabase a Resend účtu.

### 3. Vytvoř databázi v Supabase
1. Jdi na [supabase.com](https://supabase.com) → vytvoř nový projekt
2. V projektu otevři **SQL Editor**
3. Vlož a spusť celý obsah souboru `supabase/schema.sql`
4. Tabulky `venues` a `inquiries` budou vytvořeny + 4 ukázková místa

### 4. Spusť dev server
```bash
npm run dev
```
Otevři [http://localhost:3000](http://localhost:3000)

### 5. Admin přístup
- URL: `/admin`
- Default heslo: `admin123` (změň v `.env.local` přes `NEXT_PUBLIC_ADMIN_PASSWORD`)

### 6. Deploy na Vercel
```bash
npx vercel
```

## Struktura projektu
```
app/
├── page.tsx                    # Homepage
├── layout.tsx                  # Root layout + fonty
├── venues/
│   ├── page.tsx               # Katalog s filtry
│   └── [slug]/page.tsx        # Detail místa + sticky form
├── admin/                     # Heslem chráněná administrace
└── api/                       # REST endpoints

components/
├── layout/        Navbar, Footer
├── home/          Hero, FeaturedVenues, Process, Catering,
│                  Gallery, Testimonials, ConsultationCTA, FAQ
├── venues/        VenueCard, VenueFilters, InquiryForm
└── admin/         VenueForm

lib/               supabase.ts, types.ts, utils.ts
supabase/          schema.sql
```

## Sekce homepage
1. **Cinematic Hero** — parallax pozadí, animované nadpisy, glass trust karty
2. **Featured Venues** — 3 doporučená místa s editorial layoutem
3. **Jak fungujeme** — 3 kroky s ikonami, animovaný timeline
4. **Catering & Full Service** — split layout s feature listem
5. **Gallery** — masonry grid + lightbox modální
6. **Testimonials** — animované staty + recenze párů
7. **Consultation CTA** — forest green sekce s konzultačním formulářem
8. **FAQ** — accordion s reálnými dotazy

## Designový systém
- Ivory `#F9F6F0` · Champagne Gold `#C9A96E` · Forest Green `#1F3A2C` · Beige `#E8DDD0`
- Cormorant Garamond — display nadpisy (italic akcenty)
- Geist — body text

## Příkazy
```bash
npm run dev      # Vývoj na :3000
npm run build    # Produkční build
npm run start    # Spuštění produkční verze
npm run lint     # ESLint kontrola
```
