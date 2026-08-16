-- ==========================================================
-- Mass Diamond — 0006: Messaging (buyer/seller, renter/owner, customer/business)
-- Deliberately separate from the AI "conversations" table in 0002.
-- ==========================================================

create table public.message_threads (
  id uuid primary key default gen_random_uuid(),
  context_type text not null check (context_type in ('marketplace', 'real_estate', 'business', 'direct')),
  context_id uuid, -- listing_id / property_id / business_id, nullable for direct messages
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.thread_participants (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_blocked boolean not null default false,
  last_read_at timestamptz,
  unique (thread_id, user_id)
);

create table public.thread_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  attachment_url text,
  created_at timestamptz not null default now()
);

create table public.message_reports (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.message_threads(id) on delete cascade,
  message_id uuid references public.thread_messages(id) on delete cascade,
  reported_by uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

create index thread_participants_user_idx on public.thread_participants(user_id);
create index thread_messages_thread_idx on public.thread_messages(thread_id, created_at asc);

alter table public.message_threads enable row level security;
alter table public.thread_participants enable row level security;
alter table public.thread_messages enable row level security;
alter table public.message_reports enable row level security;

-- Users may only see threads / participants / messages for threads
-- they participate in. This is the core "only participants" rule.
create policy "participants can view their threads"
  on public.message_threads for select
  using (exists (select 1 from public.thread_participants tp where tp.thread_id = id and tp.user_id = auth.uid()));

create policy "authenticated users can create threads"
  on public.message_threads for insert
  with check (auth.uid() is not null);

create policy "participants can view thread participant rows"
  on public.thread_participants for select
  using (exists (
    select 1 from public.thread_participants me
    where me.thread_id = thread_participants.thread_id and me.user_id = auth.uid()
  ));

create policy "users can add themselves as a participant"
  on public.thread_participants for insert
  with check (user_id = auth.uid());

create policy "users can update their own participant row"
  on public.thread_participants for update
  using (user_id = auth.uid());

create policy "participants can read messages in their threads"
  on public.thread_messages for select
  using (exists (
    select 1 from public.thread_participants tp
    where tp.thread_id = thread_messages.thread_id and tp.user_id = auth.uid()
  ));

create policy "participants can send messages in their threads"
  on public.thread_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.thread_participants tp
      where tp.thread_id = thread_messages.thread_id and tp.user_id = auth.uid() and tp.is_blocked = false
    )
  );

create policy "users can report messages"
  on public.message_reports for insert
  with check (reported_by = auth.uid());

create policy "admins view reports"
  on public.message_reports for select
  using (public.has_role(auth.uid(), 'admin'));

create trigger message_threads_set_updated_at
  before update on public.message_threads
  for each row execute function public.set_updated_at();

create or replace function public.touch_thread()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.message_threads set updated_at = now() where id = new.thread_id;
  return new;
end;
$$;

create trigger thread_messages_touch_thread
  after insert on public.thread_messages
  for each row execute function public.touch_thread();
