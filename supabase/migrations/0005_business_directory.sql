-- ==========================================================
-- Mass Diamond — 0005: Business Directory
-- ==========================================================

create type public.verification_status as enum ('unverified', 'pending', 'verified', 'rejected');

create table public.business_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  name text not null,
  description text,
  category_id uuid references public.business_categories(id) on delete set null,
  address text,
  city text,
  country text,
  phone text,
  website text,
  services text[],
  menu_url text,
  verification_status public.verification_status not null default 'unverified',
  status public.listing_status not null default 'pending_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  open_time time,
  close_time time,
  is_closed boolean not null default false
);

create table public.business_images (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0
);

create table public.business_reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  text text,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  unique (business_id, user_id) -- one review per user per business, guards obvious duplicates
);

create table public.business_claims (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  claimant_id uuid not null references auth.users(id) on delete cascade,
  proof_notes text,
  status text not null default 'pending', -- pending | approved | rejected | info_requested
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.favorites
  add constraint favorites_business_fk foreign key (business_id) references public.businesses(id) on delete cascade;

create index businesses_status_idx on public.businesses(status, created_at desc);
create index businesses_location_idx on public.businesses(country, city);
create index businesses_category_idx on public.businesses(category_id);

alter table public.business_categories enable row level security;
alter table public.businesses enable row level security;
alter table public.business_hours enable row level security;
alter table public.business_images enable row level security;
alter table public.business_reviews enable row level security;
alter table public.business_claims enable row level security;

create policy "business categories are publicly readable"
  on public.business_categories for select using (true);
create policy "admins manage business categories"
  on public.business_categories for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "published businesses are publicly readable"
  on public.businesses for select
  using (status = 'published' or owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "authenticated users can submit a business"
  on public.businesses for insert
  with check (auth.uid() is not null);

create policy "owners update their own business"
  on public.businesses for update
  using (owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "admins delete businesses"
  on public.businesses for delete
  using (public.has_role(auth.uid(), 'admin'));

create policy "business hours follow business visibility"
  on public.business_hours for select
  using (exists (select 1 from public.businesses b where b.id = business_id
    and (b.status = 'published' or b.owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'))));
create policy "owners manage their business hours"
  on public.business_hours for all
  using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()));

create policy "business images follow business visibility"
  on public.business_images for select
  using (exists (select 1 from public.businesses b where b.id = business_id
    and (b.status = 'published' or b.owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'))));
create policy "owners manage their business images"
  on public.business_images for all
  using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()));

create policy "reviews on published businesses are publicly readable"
  on public.business_reviews for select
  using (
    is_hidden = false
    and exists (select 1 from public.businesses b where b.id = business_id and b.status = 'published')
    or public.has_role(auth.uid(), 'admin')
  );
create policy "authenticated users write their own review"
  on public.business_reviews for insert
  with check (auth.uid() = user_id);
create policy "users update or delete their own review"
  on public.business_reviews for update using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "users delete their own review"
  on public.business_reviews for delete using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create policy "claimants view their own claims"
  on public.business_claims for select
  using (claimant_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "authenticated users can claim a business"
  on public.business_claims for insert
  with check (claimant_id = auth.uid());
create policy "admins manage claims"
  on public.business_claims for update
  using (public.has_role(auth.uid(), 'admin'));

create trigger businesses_set_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();
create trigger business_claims_set_updated_at
  before update on public.business_claims
  for each row execute function public.set_updated_at();
