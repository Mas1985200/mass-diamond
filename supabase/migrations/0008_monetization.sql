-- ==========================================================
-- Mass Diamond — 0008: Monetization architecture
-- Subscriptions, payments, orders, ads, affiliate, crypto config.
-- IMPORTANT: no row here represents a real transaction unless it was
-- written by a verified payment-provider webhook (server-side only).
-- ==========================================================

create type public.subscription_plan as enum ('free', 'pro_ai', 'business_basic', 'business_pro');
create type public.subscription_status as enum ('active', 'past_due', 'canceled', 'trialing');
create type public.payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan public.subscription_plan not null default 'free',
  status public.subscription_status not null default 'active',
  provider text,                 -- e.g. 'stripe', 'zarinpal'
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  provider text not null,
  provider_reference text,
  status public.payment_status not null default 'pending',
  purpose text, -- 'subscription' | 'featured_listing' | 'featured_property' | 'order' | ...
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid references public.marketplace_listings(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  amount numeric(12,2),
  currency text default 'USD',
  status text not null default 'pending', -- pending | paid | shipped | completed | canceled
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.advertisements (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  target_country text,
  target_city text,
  target_category text,
  budget numeric(12,2),
  status text not null default 'pending_review', -- pending_review | active | paused | rejected | completed
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create table public.affiliate_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text,
  status text not null default 'pending', -- pending | active | suspended
  created_at timestamptz not null default now()
);

create table public.affiliate_products (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.affiliate_partners(id) on delete cascade,
  title text not null,
  url text not null,
  image_url text,
  price numeric(12,2),
  currency text default 'USD'
);

create table public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.affiliate_products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.affiliate_conversions (
  id uuid primary key default gen_random_uuid(),
  click_id uuid references public.affiliate_clicks(id) on delete set null,
  product_id uuid not null references public.affiliate_products(id) on delete cascade,
  order_value numeric(12,2),
  currency text default 'USD',
  -- Conversions are only ever written by a verified affiliate-network
  -- webhook (service role). Never inserted client-side.
  created_at timestamptz not null default now()
);

create table public.commissions (
  id uuid primary key default gen_random_uuid(),
  conversion_id uuid references public.affiliate_conversions(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  amount numeric(12,2) not null,
  currency text default 'USD',
  status text not null default 'pending', -- pending | paid
  created_at timestamptz not null default now()
);

-- Admin-configurable crypto payment methods. Public wallet addresses
-- only — private keys are NEVER stored in this database.
create table public.support_payment_methods (
  id uuid primary key default gen_random_uuid(),
  asset text not null,           -- e.g. 'USDT', 'BTC'
  network text not null,         -- e.g. 'TRC20', 'ERC20', 'Bitcoin'
  wallet_address text not null,
  instructions text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.orders enable row level security;
alter table public.advertisements enable row level security;
alter table public.affiliate_partners enable row level security;
alter table public.affiliate_products enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.affiliate_conversions enable row level security;
alter table public.commissions enable row level security;
alter table public.support_payment_methods enable row level security;

create policy "users view their own subscription"
  on public.subscriptions for select using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "admins manage subscriptions"
  on public.subscriptions for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "users view their own payments"
  on public.payments for select using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "admins manage payments"
  on public.payments for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "buyers view their own orders"
  on public.orders for select using (buyer_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "admins manage orders"
  on public.orders for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "advertisers view their own ads"
  on public.advertisements for select using (advertiser_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "advertisers create ads"
  on public.advertisements for insert with check (advertiser_id = auth.uid());
create policy "admins moderate ads"
  on public.advertisements for update using (public.has_role(auth.uid(), 'admin'));
create policy "published ads are publicly readable"
  on public.advertisements for select using (status = 'active');

create policy "admins manage affiliate tables"
  on public.affiliate_partners for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "active affiliate products are publicly readable"
  on public.affiliate_products for select using (true);
create policy "admins manage affiliate products"
  on public.affiliate_products for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admins view affiliate clicks"
  on public.affiliate_clicks for select using (public.has_role(auth.uid(), 'admin'));
create policy "admins view conversions"
  on public.affiliate_conversions for select using (public.has_role(auth.uid(), 'admin'));
create policy "admins view commissions"
  on public.commissions for select using (public.has_role(auth.uid(), 'admin'));

create policy "active payment methods are publicly readable"
  on public.support_payment_methods for select using (is_active = true or public.has_role(auth.uid(), 'admin'));
create policy "admins manage payment methods"
  on public.support_payment_methods for all
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();
