-- Označí 22 VIP svatebních míst (placená propagace).
-- Pouze tyto se zobrazí v sekci "VIP výběr" na hlavní stránce a v AI doporučení.

-- 1) Zruš featured u všech míst (start z čistého stavu)
update venues set is_featured = false;

-- 2) Označ těchto 22 míst jako VIP / featured
update venues set is_featured = true where slug in (
  'kvitkuv-dvur',
  'zamecek-dubi',
  'penzion-tereza',
  'stara-posta-varvazov',
  'apartmany-ralsko',
  'fara-pod-milesovkou',
  'zamek-cekanice',
  'vitovsky-statek',
  'panstvi-bzi',
  'statek-u-kaplicky',
  'zamecky-resort-stablovice',
  'hotel-garden-uholubu',
  'victoria-garden',
  'capi-hnizdo',
  'stodola-pod-lesem',
  'hotel-horni-dvur',
  'smrciny',
  'baresuv-ranc',
  'hotel-racek',
  'resort-oblik',
  'villa-bork',
  'srub-jezkovec'
);

-- Ověření: kolik je teď VIP míst?
select count(*) as vip_count from venues where is_featured = true;
