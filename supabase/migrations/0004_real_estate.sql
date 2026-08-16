-- ==========================================================
-- Mass Diamond — 0004: Real Estate
-- ==========================================================

create type public.property_type as enum ('apartment', 'house', 'studio', 'villa', 'office', 'land', 'other');
create type public.listing_purpose as enum ('sale', 'rent');
create type public.rent_period as enum ('night', 'month', 'year');

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  property_type public.property_type not null,
  purpose public.listing_purpose not null,
  title text not null,
  description text,
  price numeric(12,2),
  currency text not null default 'USD',
  rent_period public.rent_period,
  bedrooms integer,
  bathrooms integer,
  area numeric(10,2),
  country text,
  city text,
  location_text text,
  latitude double precision,
  longitude double precision,
  status public.listing_status not null default 'draft',
  ai_generated boolean not null default false,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.property_features (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  feature text not null
);

alter table public.favorites
  add constraint favorites_property_fk foreign key (property_id) references public.properties(id) on delete cascade;

create index properties_status_idx on public.properties(status, created_at desc);
create index properties_location_idx on public.properties(country, city);
create index properties_filters_idx on public.properties(purpose, property_type, price, bedrooms, bathrooms);

alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.property_features enable row level security;

create policy "published properties are publicly readable"
  on public.properties for select
  using (status = 'published' or owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "owners create their own properties"
  on public.properties for insert
  with check (owner_id = auth.uid());

create policy "owners update their own properties"
  on public.properties for update
  using (owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "owners delete their own properties"
  on public.properties for delete
  using (owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "property images follow property visibility"
  on public.property_images for select
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id
        and (p.status = 'published' or p.owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
    )
  );

create policy "owners manage images on their own properties"
  on public.property_images for insert
  with check (exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid()));

create policy "owners delete images on their own properties"
  on public.property_images for delete
  using (exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid()));

create policy "property features follow property visibility"
  on public.property_features for select
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id
        and (p.status = 'published' or p.owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
    )
  );

create policy "owners manage features on their own properties"
  on public.property_features for all
  using (exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid()));

create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

create trigger properties_enforce_review
  before update on public.properties
  for each row execute function public.enforce_listing_review();
