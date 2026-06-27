-- 1500 Blueprint — single-module practice attempts (history for the
-- "practice a single module" feature). SEPARATE from public.test_attempts
-- (full adaptive tests) because a module attempt is a raw correct/total, not a
-- scaled section/total score.
-- PREREQUISITE: auth.sql (public.users). Paste into Supabase → SQL Editor → Run.
-- Safe to re-run. Server-only: written with the service-role key; RLS on, no
-- public policies (all access via lib/sat/moduleAttempts.ts).

create table if not exists public.module_attempts (
  id                text primary key default gen_random_uuid()::text,
  email             text not null references public.users(email) on delete cascade,
  test_slug         text not null,
  module_key        text not null,   -- rw-1 | rw-2-easy | rw-2-hard | math-1 | math-2-easy | math-2-hard
  label             text not null,   -- "Math — Module 2 (Hard)"
  correct           int  not null,
  total             int  not null,
  answers           jsonb,           -- stored so the per-question review recomputes on view
  per_question_time jsonb,
  client_token      text,            -- idempotent completion (retry-safe)
  created_at        timestamptz not null default now()
);

create index if not exists module_attempts_email_created_idx on public.module_attempts(email, created_at desc);
create index if not exists module_attempts_email_slug_idx     on public.module_attempts(email, test_slug);
create unique index if not exists module_attempts_client_token_key
  on public.module_attempts(client_token) where client_token is not null;

alter table public.module_attempts enable row level security;

notify pgrst, 'reload schema';
