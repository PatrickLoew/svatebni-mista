-- Rozšíření site_settings o všechny editovatelné texty
-- Spusť jednou v Supabase SQL editoru

alter table site_settings
  add column if not exists hero_primary_cta text,
  add column if not exists hero_secondary_cta text,

  add column if not exists process_eyebrow text,
  add column if not exists process_title text,
  add column if not exists process_subtitle text,
  add column if not exists process1_title text,
  add column if not exists process1_desc text,
  add column if not exists process2_title text,
  add column if not exists process2_desc text,
  add column if not exists process3_title text,
  add column if not exists process3_desc text,

  add column if not exists cta_eyebrow text,
  add column if not exists cta_title text,
  add column if not exists cta_subtitle text,
  add column if not exists card1_title text,
  add column if not exists card1_description text,
  add column if not exists card2_title text,
  add column if not exists card2_description text,

  add column if not exists faq1_q text,
  add column if not exists faq1_a text,
  add column if not exists faq2_q text,
  add column if not exists faq2_a text,
  add column if not exists faq3_q text,
  add column if not exists faq3_a text,
  add column if not exists faq4_q text,
  add column if not exists faq4_a text,
  add column if not exists faq5_q text,
  add column if not exists faq5_a text,
  add column if not exists faq6_q text,
  add column if not exists faq6_a text,

  add column if not exists footer_description text;
