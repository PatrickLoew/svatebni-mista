-- Svatební místa – Supabase schema
-- Spusťte v Supabase SQL editoru

-- Tabulka míst
create table if not exists venues (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  description text not null,
  location    text not null,
  region      text not null,
  type        text not null,
  capacity    integer not null default 50,
  price_from  integer not null default 50000,
  services    text[] default '{}',
  images      text[] default '{}',
  features    text[] default '{}',
  is_featured boolean default false,
  created_at  timestamptz default now()
);

-- Tabulka poptávek
create table if not exists inquiries (
  id           uuid primary key default gen_random_uuid(),
  venue_id     uuid references venues(id) on delete set null,
  name         text not null,
  email        text not null,
  phone        text not null,
  wedding_date date not null,
  guests       integer not null,
  message      text,
  status       text default 'new' check (status in ('new','contacted','confirmed','declined')),
  created_at   timestamptz default now()
);

-- Indexy
create index if not exists venues_region_idx on venues(region);
create index if not exists venues_type_idx on venues(type);
create index if not exists venues_featured_idx on venues(is_featured);
create index if not exists inquiries_venue_idx on inquiries(venue_id);
create index if not exists inquiries_status_idx on inquiries(status);

-- RLS – veřejné čtení míst, vkládání poptávek
alter table venues enable row level security;
alter table inquiries enable row level security;

create policy "Veřejné čtení míst" on venues for select using (true);
create policy "Vkládání poptávek" on inquiries for insert with check (true);

-- Pro admin API route (service role key obejde RLS automaticky)

-- Ukázková data
insert into venues (slug, title, description, location, region, type, capacity, price_from, services, images, features, is_featured) values
(
  'zamek-hluboka',
  'Zámek Hluboká nad Vltavou',
  'Romantický novogotický zámek s pohádkovou atmosférou. Ideální pro nezapomenutelný svatební den v historickém prostředí obklopeném krásnou přírodou.',
  'Hluboká nad Vltavou, Jihočeský kraj',
  'Jihočeský',
  'Zámek',
  200,
  150000,
  ARRAY['Catering', 'Ubytování', 'Dekorace', 'Fotograf', 'Hudba'],
  ARRAY[
    'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200',
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200',
    'https://images.unsplash.com/photo-1561489422-45f6fc4d48f9?w=1200'
  ],
  ARRAY['Parkování zdarma', 'Bezbariérový přístup', 'Zahradní obřad', 'Noční osvětlení'],
  true
),
(
  'vinny-sklep-morava',
  'Vinný sklep Morava',
  'Autentický moravský vinný sklep s jedinečnou atmosférou. Intimní prostředí pro menší svatby s degustací místních vín a tradičními moravskými pokrmy.',
  'Mikulov, Jihomoravský kraj',
  'Jihomoravský',
  'Vinný sklep',
  80,
  60000,
  ARRAY['Catering', 'Degustace vín', 'Dekorace', 'DJ'],
  ARRAY[
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
    'https://images.unsplash.com/photo-1470158499416-75be9aa0c4db?w=1200'
  ],
  ARRAY['Vlastní vinice', 'Ubytování v okolí', 'Venkovní terasa'],
  true
),
(
  'hotel-ambassador-praha',
  'Hotel Ambassador Praha',
  'Luxusní historický hotel v samém srdci Prahy. Velkolepé sály, výhled na Václavské náměstí a bezchybný servis pro váš výjimečný den.',
  'Václavské náměstí, Praha 1',
  'Praha',
  'Hotel',
  300,
  200000,
  ARRAY['Catering', 'Ubytování', 'Dekorace', 'Fotograf', 'Video', 'Hudba', 'SPA'],
  ARRAY[
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'
  ],
  ARRAY['Valet parking', 'Kongresové centrum', 'SPA & Wellness', 'Klimatizace', 'Výtah'],
  true
),
(
  'statek-pod-duby',
  'Statek Pod Duby',
  'Kouzelný venkovský statek v malebné krajině středních Čech. Rustikální elegance s moderním zázemím pro vaši dokonalou venkovní svatbu.',
  'Říčany, Středočeský kraj',
  'Středočeský',
  'Venkovský statek',
  120,
  80000,
  ARRAY['Catering', 'Stany', 'Dekorace', 'Fotograf'],
  ARRAY[
    'https://images.unsplash.com/photo-1505932794465-147d1f1b2c97?w=1200',
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200'
  ],
  ARRAY['Zahradní obřad', 'Stodola', 'Dětský koutek', 'Volné parkování', 'Firemní ubytování'],
  false
);
