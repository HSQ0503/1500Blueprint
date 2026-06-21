-- 1500 Blueprint — gamification schema (XP, levels, streaks, daily goals, achievements).
-- Run AFTER auth.sql. Paste into Supabase → SQL Editor → New query → Run. Safe to re-run.
-- Server-only: written with the secret (service-role) key; RLS on, no public policies.

-- Per-user gamification state lives on the users row.
alter table public.users add column if not exists name              text;
alter table public.users add column if not exists xp                integer     not null default 0;
alter table public.users add column if not exists streak_current    integer     not null default 0;
alter table public.users add column if not exists streak_longest    integer     not null default 0;
alter table public.users add column if not exists last_active_date  date;
alter table public.users add column if not exists daily_goal_target integer     not null default 5;
alter table public.users add column if not exists onboarded_at      timestamptz;

-- Append-only XP ledger; the running total is mirrored on users.xp.
create table if not exists public.xp_events (
  id         text primary key default gen_random_uuid()::text,
  email      text not null references public.users(email) on delete cascade,
  amount     integer not null,
  reason     text not null,            -- 'drill' | 'test' | ...
  ref        text,                     -- drill/test slug
  created_at timestamptz not null default now()
);
create index if not exists xp_events_email_time_idx on public.xp_events(email, created_at);

-- One row per completed drill attempt.
create table if not exists public.drill_attempts (
  id         text primary key default gen_random_uuid()::text,
  email      text not null references public.users(email) on delete cascade,
  drill_slug text not null,
  correct    integer,
  total      integer,
  score      integer,                  -- 0..100
  xp_awarded integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists drill_attempts_email_time_idx on public.drill_attempts(email, created_at);

-- One row per completed practice test.
create table if not exists public.test_attempts (
  id          text primary key default gen_random_uuid()::text,
  email       text not null references public.users(email) on delete cascade,
  test_slug   text not null,
  total_score integer,
  rw_score    integer,
  math_score  integer,
  xp_awarded  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists test_attempts_email_time_idx on public.test_attempts(email, created_at);

-- Unlocked achievements (the catalog itself lives in lib/gamification/engine.ts).
create table if not exists public.user_achievements (
  email          text not null references public.users(email) on delete cascade,
  achievement_id text not null,
  unlocked_at    timestamptz not null default now(),
  primary key (email, achievement_id)
);

alter table public.xp_events         enable row level security;
alter table public.drill_attempts    enable row level security;
alter table public.test_attempts     enable row level security;
alter table public.user_achievements enable row level security;

-- Atomic XP increment; returns the new running total.
create or replace function public.add_xp(p_email text, p_amount integer)
returns integer
language sql
as $$
  update public.users set xp = xp + p_amount where email = p_email returning xp;
$$;

-- Weekly leaderboard: total XP earned per user since p_since, highest first.
create or replace function public.weekly_leaderboard(p_since timestamptz)
returns table(email text, weekly_xp bigint)
language sql
stable
as $$
  select e.email, coalesce(sum(e.amount), 0) as weekly_xp
  from public.xp_events e
  where e.created_at >= p_since and e.amount > 0
  group by e.email
  order by weekly_xp desc;
$$;
