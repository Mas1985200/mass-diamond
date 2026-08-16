-- ==========================================================
-- Mass Diamond — 0007: Notifications + platform-wide reporting/moderation
-- ==========================================================

create type public.notification_type as enum (
  'new_message', 'listing_approved', 'listing_rejected', 'new_review',
  'favorite_activity', 'subscription_event', 'system'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications(user_id, is_read, created_at desc);

alter table public.notifications enable row level security;

create policy "users manage their own notifications"
  on public.notifications for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------- platform-wide reports (users, listings, properties, businesses, reviews, messages) ----------
create type public.report_target as enum ('user', 'listing', 'property', 'business', 'review', 'message');
create type public.report_status as enum ('open', 'reviewing', 'resolved', 'rejected');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type public.report_target not null,
  target_id uuid not null,
  reason text not null,
  status public.report_status not null default 'open',
  resolution_notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.reports enable row level security;

create policy "users can create reports"
  on public.reports for insert
  with check (reporter_id = auth.uid());

create policy "users can view their own reports"
  on public.reports for select
  using (reporter_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "admins manage reports"
  on public.reports for update
  using (public.has_role(auth.uid(), 'admin'));
