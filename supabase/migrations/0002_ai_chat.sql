-- ==========================================================
-- Mass Diamond — 0002: AI chat (conversations, messages)
-- ==========================================================

create type public.message_role as enum ('user', 'assistant', 'system');
create type public.ai_capability as enum ('GENERAL_CHAT', 'SEARCH', 'MARKETPLACE', 'REAL_ESTATE', 'BUSINESS');

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.message_role not null,
  content text not null,
  attachment_url text,
  capability public.ai_capability,
  created_at timestamptz not null default now()
);

create index conversations_user_id_idx on public.conversations(user_id, updated_at desc);
create index messages_conversation_id_idx on public.messages(conversation_id, created_at asc);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "users manage their own conversations"
  on public.conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage messages in their own conversations"
  on public.messages for all
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

-- Bump conversation.updated_at whenever a new message is inserted,
-- so conversation lists can sort by recent activity.
create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation();

-- AI usage log — used by the admin "AI Usage" dashboard.
-- Populated server-side only, by the ai-chat Edge Function (service role).
create table public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  capability public.ai_capability,
  provider text,
  input_tokens integer,
  output_tokens integer,
  created_at timestamptz not null default now()
);

alter table public.ai_usage_logs enable row level security;

create policy "admins can view ai usage logs"
  on public.ai_usage_logs for select
  using (public.has_role(auth.uid(), 'admin'));

-- No insert/update/delete policy for regular users: rows are written
-- exclusively by the Edge Function using the service-role key, which
-- bypasses RLS by design.
