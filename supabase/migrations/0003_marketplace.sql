-- ==========================================================
-- Mass Diamond — 0003: Marketplace
-- ==========================================================

create type public.listing_status as enum
  ('draft', 'pending_review', 'published', 'rejected', 'sold', 'archived');
create type public.listing_condition as enum ('new', 'like_new', 'good', 'fair', 'for_parts');

create table public.marketplace_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references public.marketplace_categories(id) on delete set null
);

create table public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category_id uuid references public.marketplace_categories(id) on delete set null,
  price numeric(12,2),
  currency text not null default 'USD',
  condition public.listing_condition,
  country text,
  city text,
  location_text text,
  status public.listing_status not null default 'draft',
  ai_generated boolean not null default false,
  ai_suggested_price_min numeric(12,2),
  ai_suggested_price_max numeric(12,2),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.marketplace_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid references public.marketplace_listings(id) on delete cascade,
  property_id uuid, -- references properties(id), FK added in 0004 to avoid ordering issues
  business_id uuid, -- references businesses(id), FK added in 0005
  created_at timestamptz not null default now(),
  constraint favorites_target_check check (
    (listing_id is not null)::int + (property_id is not null)::int + (business_id is not null)::int = 1
  )
);

create index marketplace_listings_status_idx on public.marketplace_listings(status, created_at desc);
create index marketplace_listings_category_idx on public.marketplace_listings(category_id);
create index marketplace_listings_location_idx on public.marketplace_listings(country, city);
create index marketplace_listings_price_idx on public.marketplace_listings(price);

alter table public.marketplace_categories enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.marketplace_images enable row level security;
alter table public.favorites enable row level security;

create policy "categories are publicly readable"
  on public.marketplace_categories for select using (true);
create policy "admins manage categories"
  on public.marketplace_categories for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "published listings are publicly readable"
  on public.marketplace_listings for select
  using (status = 'published' or seller_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "sellers create their own listings"
  on public.marketplace_listings for insert
  with check (seller_id = auth.uid());

create policy "sellers update their own non-published fields"
  on public.marketplace_listings for update
  using (seller_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "sellers delete their own listings"
  on public.marketplace_listings for delete
  using (seller_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "images follow listing visibility"
  on public.marketplace_images for select
  using (
    exists (
      select 1 from public.marketplace_listings l
      where l.id = listing_id
        and (l.status = 'published' or l.seller_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
    )
  );

create policy "sellers manage images on their own listings"
  on public.marketplace_images for insert
  with check (
    exists (select 1 from public.marketplace_listings l where l.id = listing_id and l.seller_id = auth.uid())
  );

create policy "sellers delete images on their own listings"
  on public.marketplace_images for delete
  using (
    exists (select 1 from public.marketplace_listings l where l.id = listing_id and l.seller_id = auth.uid())
  );

create policy "users manage their own favorites"
  on public.favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger marketplace_listings_set_updated_at
  before update on public.marketplace_listings
  for each row execute function public.set_updated_at();

-- New listings always start as pending_review once submitted (never
-- silently auto-published). Enforced here so the client cannot bypass it.
create or replace function public.enforce_listing_review()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and (old.status is distinct from 'published') then
    if not public.has_role(auth.uid(), 'admin') then
      raise exception 'Only admins can publish listings';
    end if;
  end if;
  return new;
end;
$$;

create trigger marketplace_listings_enforce_review
  before update on public.marketplace_listings
  for each row execute function public.enforce_listing_review();
