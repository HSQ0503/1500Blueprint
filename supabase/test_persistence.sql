-- 1500 Blueprint — practice-test persistence: completed attempts + in-progress resume.
-- PREREQUISITES: run auth.sql then gamification.sql first. This file EXTENDS
-- public.test_attempts (created in gamification.sql) and references public.users
-- (created in auth.sql); it does not create them. Paste into Supabase → SQL Editor
-- → New query → Run. Safe to re-run.
-- Server-only: written with the secret (service-role) key; RLS on, no public policies.

-- Store enough on each completed attempt to recompute the full report deterministically
-- (lib/sat/scoring.ts scoreTest is pure): the answer map, the routed module-2 variants,
-- and per-question time. The detailed report is never denormalized — it is recomputed on view.
alter table public.test_attempts add column if not exists answers           jsonb;
alter table public.test_attempts add column if not exists routed            jsonb;
alter table public.test_attempts add column if not exists per_question_time jsonb;
alter table public.test_attempts add column if not exists completed_at      timestamptz;

-- Idempotency: a client-generated token per finish makes the completion POST safe
-- to retry. The partial unique index leaves pre-existing (null-token) rows alone.
alter table public.test_attempts add column if not exists client_token      text;
create unique index if not exists test_attempts_client_token_key
  on public.test_attempts(client_token)
  where client_token is not null;

-- One in-progress session per (student, test). Holds the serialized runner state
-- (lib/sat/testState.ts TestState) so a student can exit mid-test and resume exactly
-- where they left off. Deleted on completion, so a finished test never offers resume.
create table if not exists public.test_sessions (
  email      text not null references public.users(email) on delete cascade,
  test_slug  text not null,
  state      jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (email, test_slug)
);
create index if not exists test_sessions_email_idx on public.test_sessions(email);

alter table public.test_sessions enable row level security;
