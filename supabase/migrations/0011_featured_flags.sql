-- ==========================================================
-- Mass Diamond — 0011: featured listings/properties
-- Supports monetization item #3/#4 in spec section 33.
-- Flipped to true ONLY by stripe-webhook after a confirmed payment —
-- never client-writable (no RLS update policy grants this column to
-- regular users; enforced via the column-level check below).
-- ==========================================================

alter table public.marketplace_listings
  add column is_featured boolean not null default false,
  add column featured_until timestamptz;

alter table public.properties
  add column is_featured boolean not null default false,
  add column featured_until timestamptz;

create index marketplace_listings_featured_idx on public.marketplace_listings(is_featured, featured_until);
create index properties_featured_idx on public.properties(is_featured, featured_until);

-- Prevent sellers/owners from setting is_featured themselves through
-- their existing "update their own listing" policy: only an admin (or
-- the service-role key used by stripe-webhook, which bypasses RLS) may
-- change it.
create or replace function public.enforce_featured_flag()
returns trigger
language plpgsql
as $$
begin
  if new.is_featured is distinct from old.is_featured then
    if not public.has_role(auth.uid(), 'admin') then
      raise exception 'Only admins or the payment webhook may change featured status';
    end if;
  end if;
  return new;
end;
$$;

create trigger marketplace_listings_enforce_featured
  before update on public.marketplace_listings
  for each row execute function public.enforce_featured_flag();

create trigger properties_enforce_featured
  before update on public.properties
  for each row execute function public.enforce_featured_flag();
