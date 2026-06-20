-- 1500 Blueprint — practice-test content schema.
-- Paste into Supabase → SQL Editor → New query → Run. Safe to re-run.
-- Runtime reads use the publishable (anon) key via RLS; the importer writes with
-- the secret (service-role) key, which bypasses RLS.

create table if not exists public.tests (
  id             text primary key default gen_random_uuid()::text,
  slug           text unique not null,
  title          text not null,
  break_minutes  int  not null default 10,
  rw_threshold   real not null default 0.63,   -- route to hard R&W M2 if frac correct >= (≈17/27)
  math_threshold real not null default 0.64,   -- route to hard Math M2 if frac correct >= (≈14/22)
  source_file    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.modules (
  id                 text primary key default gen_random_uuid()::text,
  test_id            text not null references public.tests(id) on delete cascade,
  section            text not null,            -- 'rw' | 'math'
  "order"            int  not null,            -- 1 | 2
  variant            text not null,            -- 'm1' | 'easy' | 'hard'
  minutes_per_module int  not null,           -- 32 rw / 35 math
  label              text,
  unique (test_id, section, "order", variant)
);

create table if not exists public.questions (
  id                 text primary key default gen_random_uuid()::text,
  module_id          text not null references public.modules(id) on delete cascade,
  position           int  not null,            -- 1-based within the module
  type               text not null,            -- 'mc' | 'grid'
  domain             text,
  skill              text,
  difficulty         text,                     -- 'easy' | 'medium' | 'hard'
  passage            text,
  prompt             text not null,
  figure_url         text,
  correct            text,                     -- 'A'..'D' for mc
  accepted_answers   text[] not null default '{}',
  explanation        text,
  explanation_source text,                     -- 'ai' | 'human'
  needs_review       boolean not null default false,
  unique (module_id, position)
);

create table if not exists public.choices (
  id          text primary key default gen_random_uuid()::text,
  question_id text not null references public.questions(id) on delete cascade,
  letter      text not null,                   -- 'A'..'D'
  text        text not null,
  explanation text,
  unique (question_id, letter)
);

create index if not exists modules_test_idx    on public.modules(test_id);
create index if not exists questions_module_idx on public.questions(module_id);
create index if not exists choices_question_idx on public.choices(question_id);

-- Row Level Security: content is publicly readable; writes only via service-role.
alter table public.tests     enable row level security;
alter table public.modules   enable row level security;
alter table public.questions enable row level security;
alter table public.choices   enable row level security;

drop policy if exists "public read tests"     on public.tests;
drop policy if exists "public read modules"   on public.modules;
drop policy if exists "public read questions" on public.questions;
drop policy if exists "public read choices"   on public.choices;

create policy "public read tests"     on public.tests     for select using (true);
create policy "public read modules"   on public.modules   for select using (true);
create policy "public read questions" on public.questions for select using (true);
create policy "public read choices"   on public.choices   for select using (true);

grant select on public.tests, public.modules, public.questions, public.choices
  to anon, authenticated;
