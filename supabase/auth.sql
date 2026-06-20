-- 1500 Blueprint — auth (magic-link) schema.
-- Paste into Supabase → SQL Editor → New query → Run. Safe to re-run.
-- Server-only: the app reads/writes this with the secret (service-role) key,
-- which bypasses RLS. No anon/publishable access is granted, so a leaked
-- publishable key can never read login tokens.

create table if not exists public.login_tokens (
  id          text primary key default gen_random_uuid()::text,
  email       text not null,
  token_hash  text not null,                 -- sha256(raw token); the raw token is emailed, never stored
  plan        text,                          -- captured from Stripe at request time
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists login_tokens_hash_idx  on public.login_tokens(token_hash);
create index if not exists login_tokens_email_idx on public.login_tokens(email);

-- Locked down: RLS on, no policies, no grants → only the service-role key reaches it.
alter table public.login_tokens enable row level security;
