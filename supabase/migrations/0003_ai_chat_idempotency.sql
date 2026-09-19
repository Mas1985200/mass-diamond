-- ==========================================================
-- Mass Diamond — AI Chat Idempotency
-- Migration: 0003_ai_chat_idempotency.sql
--
-- Purpose:
--   1. Give user messages a stable client-generated identity.
--   2. Prevent duplicate processing during retries.
--   3. Safely recover from lost network responses.
--   4. Keep assistant/system messages compatible with the
--      existing schema by allowing client_message_id to be NULL.
-- ==========================================================

begin;

-- ----------------------------------------------------------
-- 1. Add client_message_id to messages
-- ----------------------------------------------------------

alter table public.messages
  add column if not exists client_message_id uuid;

-- ----------------------------------------------------------
-- 2. Backfill existing USER messages only.
--
-- Existing assistant/system messages do not represent a
-- client request, so they intentionally remain NULL.
-- ----------------------------------------------------------

update public.messages
set client_message_id = gen_random_uuid()
where role = 'user'
  and client_message_id is null;

-- ----------------------------------------------------------
-- 3. Enforce uniqueness for client-generated user messages.
--
-- PostgreSQL allows multiple NULL values in a UNIQUE
-- constraint, which is exactly what we need for
-- assistant/system messages.
-- ----------------------------------------------------------

create unique index if not exists
  messages_user_client_message_id_uidx
on public.messages (user_id, client_message_id)
where client_message_id is not null;

-- ----------------------------------------------------------
-- 4. Create idempotency state table.
--
-- One row represents one logical client request.
--
-- PROCESSING:
--   Request has been claimed and is being processed.
--
-- COMPLETED:
--   AI response was successfully generated and persisted.
--
-- FAILED:
--   Processing failed and the request may be retried.
-- ----------------------------------------------------------

create table if not exists public.ai_chat_idempotency (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  conversation_id uuid not null
    references public.conversations(id)
    on delete cascade,

  client_message_id uuid not null,

  status text not null,

  reply text,

  capability public.ai_capability,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint ai_chat_idempotency_status_check
    check (status in ('PROCESSING', 'COMPLETED', 'FAILED'))
);

-- ----------------------------------------------------------
-- 5. One logical request can exist only once per user.
-- ----------------------------------------------------------

create unique index if not exists
  ai_chat_idempotency_user_client_message_uidx
on public.ai_chat_idempotency (user_id, client_message_id);

-- ----------------------------------------------------------
-- 6. Useful index for conversation-level recovery/debugging.
-- ----------------------------------------------------------

create index if not exists
  ai_chat_idempotency_conversation_idx
on public.ai_chat_idempotency (conversation_id, created_at desc);

-- ----------------------------------------------------------
-- 7. Useful index for stale PROCESSING recovery.
-- ----------------------------------------------------------

create index if not exists
  ai_chat_idempotency_processing_idx
on public.ai_chat_idempotency (status, updated_at);

-- ----------------------------------------------------------
-- 8. Enable Row Level Security.
--
-- The frontend does NOT need direct access to this table.
-- ai-chat will use the Supabase service role for atomic
-- idempotency handling.
-- ----------------------------------------------------------

alter table public.ai_chat_idempotency
  enable row level security;

-- ----------------------------------------------------------
-- 9. Keep updated_at current when an idempotency row changes.
--
-- Existing project already provides public.set_updated_at().
-- ----------------------------------------------------------

create trigger ai_chat_idempotency_set_updated_at
  before update on public.ai_chat_idempotency
  for each row
  execute function public.set_updated_at();

commit;
