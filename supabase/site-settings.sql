-- Site settings — globální nastavení webu (kontakty, texty hero atd.)
-- Spusť v Supabase SQL editoru jednou.

create table if not exists site_settings (
  id integer primary key default 1,

  -- Kontaktní údaje
  phone text default '+420 123 456 789',
  whatsapp text default '+420123456789',
  email text default 'info@svatebnimista.cz',
  hours text default 'Po–Pá, 9:00 – 18:00',
  address text default 'Praha 1, Česká republika',

  -- Hero texty
  hero_eyebrow text default 'Wedding planning · Est. 2018',
  hero_title_line1 text default 'Den, který si',
  hero_title_line2 text default 'budete pamatovat',
  hero_title_line3 text default 'celý život.',
  hero_subtitle text default 'Pomáháme párům najít dokonalé místo, sestavit catering snů a postarat se o každý detail vaší svatby od A do Z.',

  -- Statistiky (zobrazené v Hero a Testimonials)
  stat_weddings text default '500+',
  stat_rating text default '4,9 ★',
  stat_venues text default '200+',
  stat_years text default '7',

  -- Závěrečný citát
  closing_quote text default 'Ať už zvolíte cokoliv — vždy se s vámi rádi spojíme. Těšíme se, že budeme moci být součástí vašeho příběhu.',
  closing_signature text default 'Tým Svatební Místa',

  -- Sociální sítě
  instagram_url text default '',
  facebook_url text default '',

  updated_at timestamptz default now(),

  constraint single_row check (id = 1)
);

-- Vlož defaultní řádek
insert into site_settings (id) values (1) on conflict (id) do nothing;

-- RLS — public read, ale write jen přes service_role
alter table site_settings enable row level security;
create policy "Public read settings" on site_settings for select using (true);
