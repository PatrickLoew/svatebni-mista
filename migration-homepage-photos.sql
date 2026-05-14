-- Přidání sloupců pro editovatelné fotky na hlavní stránce
-- Spusť v Supabase → SQL Editor → New query

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS hero_background_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery1_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery2_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery3_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery4_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery5_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery6_url TEXT;

-- Default hodnoty (jen pokud zatím nejsou nastaveny)
UPDATE site_settings SET
  hero_background_url = COALESCE(hero_background_url, 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=2400&q=85'),
  gallery1_url = COALESCE(gallery1_url, 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=85'),
  gallery2_url = COALESCE(gallery2_url, 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=85'),
  gallery3_url = COALESCE(gallery3_url, 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=85'),
  gallery4_url = COALESCE(gallery4_url, 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200&q=85'),
  gallery5_url = COALESCE(gallery5_url, 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=85'),
  gallery6_url = COALESCE(gallery6_url, 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=1200&q=85')
WHERE id = 1;

-- Ověření
SELECT
  hero_background_url,
  gallery1_url,
  gallery2_url
FROM site_settings
WHERE id = 1;
