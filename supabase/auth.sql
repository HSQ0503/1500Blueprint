-- 1500 Blueprint — auth (magic-link) schema.
-- Paste into Supabase → SQL Editor → New query → Run. Safe to re-run.
-- Server-only: the app reads/writes this with the secret (service-role) key,
-- which bypasses RLS. No anon/publishable access is granted, so a leaked
-- publishable key can never read login tokens.

create table if not exists public.login_tokens (
  id          text primary key default gen_random_uuid()::text,
  email       text not null,
  token_hash  text not null,                 -- sha256(raw token); the raw token is emailed, never stored
  plan        text,                          -- captured from Stripe or a complimentary access grant
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists login_tokens_hash_idx  on public.login_tokens(token_hash);
create index if not exists login_tokens_email_idx on public.login_tokens(email);

-- Locked down: RLS on, no policies, no grants → only the service-role key reaches it.
alter table public.login_tokens enable row level security;

-- Member records, upserted on each successful login. Server-only (service key).
create table if not exists public.users (
  id            text primary key default gen_random_uuid()::text,
  email         text unique not null,
  plan          text,
  login_count   int  not null default 0,
  created_at    timestamptz not null default now(),
  last_login_at timestamptz not null default now()
);

create index if not exists users_email_idx on public.users(email);

-- Optional profile picture (public URL in the "figures" bucket). Added after the
-- first release; idempotent, so re-running this file upgrades an install in place.
alter table public.users add column if not exists avatar_url text;

alter table public.users enable row level security;

-- Atomic upsert: insert on first login, otherwise bump plan/last_login/count.
create or replace function public.record_login(p_email text, p_plan text)
returns void
language sql
as $$
  insert into public.users (email, plan, login_count, last_login_at)
  values (p_email, p_plan, 1, now())
  on conflict (email) do update
    set plan          = excluded.plan,
        last_login_at = now(),
        login_count   = public.users.login_count + 1;
$$;
