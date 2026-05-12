-- ============================================================
-- OPRAVA: Admin nevidí všechny poptávky
-- ============================================================
-- Spusť tento SQL skript v Supabase → SQL Editor → New Query
-- ============================================================

-- 1) Zkontroluj, zda RLS je zapnuté (mělo by být)
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 2) Smaž případnou starou restriktivní SELECT politiku
DROP POLICY IF EXISTS "inquiries_select_own" ON inquiries;
DROP POLICY IF EXISTS "Users can view own inquiries" ON inquiries;

-- 3) Povol službám (service_role) plný přístup — toto API endpoint potřebuje
DROP POLICY IF EXISTS "service_role_full_access_inquiries" ON inquiries;
CREATE POLICY "service_role_full_access_inquiries"
  ON inquiries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4) Anonymní uživatelé (z formulářů) smí pouze INSERT (nikdy SELECT)
DROP POLICY IF EXISTS "anon_insert_inquiries" ON inquiries;
CREATE POLICY "anon_insert_inquiries"
  ON inquiries
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 5) Ověření — tento dotaz by měl vrátit počet všech poptávek
SELECT COUNT(*) AS total_inquiries FROM inquiries;
SELECT id, name, email, status, created_at FROM inquiries ORDER BY created_at DESC LIMIT 10;
