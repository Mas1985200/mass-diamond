-- ==========================================================
-- Mass Diamond — 0010: Seed data
-- Only taxonomy (categories) is seeded. NO fake listings, properties,
-- businesses, reviews, or transactions are ever inserted here — per
-- the "no fake functionality" rule in the spec.
-- ==========================================================

insert into public.marketplace_categories (name, slug) values
  ('Electronics', 'electronics'),
  ('Vehicles', 'vehicles'),
  ('Home & Garden', 'home-garden'),
  ('Fashion', 'fashion'),
  ('Jobs', 'jobs'),
  ('Services', 'services'),
  ('Other', 'other')
on conflict (slug) do nothing;

insert into public.business_categories (name, slug) values
  ('Restaurants', 'restaurants'),
  ('Shops', 'shops'),
  ('Services', 'services'),
  ('Companies', 'companies'),
  ('Professionals', 'professionals')
on conflict (slug) do nothing;
