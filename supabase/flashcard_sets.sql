-- 1500 Blueprint — student & admin flashcard SETS (Quizlet-style).
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to re-run (idempotent).
--
-- NOTE: This is a SEPARATE feature from the spaced-rep "flashcards" DRILL in
-- drills.sql. That drill is one global admin-authored deck reviewed inside the
-- Drills hub; THIS is user-authored, named sets of term/definition cards that a
-- student creates for themselves (and that an admin can publish to everyone).
--
-- Access model: every read/write goes through the service-role key, server-side
-- only (lib/flashcards/queries.ts), which filters by owner_email + visibility.
-- The publishable/anon key never touches these tables, so RLS is enabled with NO
-- policies or grants — same lockdown as auth.sql and the `admins` table.

-- ---------------------------------------------------------------------------
-- 1. flashcard_sets — one row per named set.
--    visibility 'private' = only the owner sees it (the default for students).
--    visibility 'shared'  = published by an admin (Scott) to ALL students.
-- ---------------------------------------------------------------------------
create table if not exists public.flashcard_sets (
  id           text primary key default gen_random_uuid()::text,
  owner_email  text not null,                 -- who authored the set
  title        text not null,
  description  text,
  visibility   text not null default 'private', -- 'private' | 'shared'
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists flashcard_sets_owner_idx      on public.flashcard_sets(owner_email);
create index if not exists flashcard_sets_visibility_idx on public.flashcard_sets(visibility);

-- ---------------------------------------------------------------------------
-- 2. flashcard_cards — one row per card, ordered by position within the set.
--    Normalized (not a jsonb array) so reordering/editing stays a clean
--    delete-and-reinsert, mirroring drill_walkthrough_steps.
-- ---------------------------------------------------------------------------
create table if not exists public.flashcard_cards (
  id         text primary key default gen_random_uuid()::text,
  set_id     text not null references public.flashcard_sets(id) on delete cascade,
  position   int  not null,                   -- 1-based order within the set
  term       text not null default '',
  definition text not null default '',
  term_image_url       text,            -- optional figure shown on the term side
  definition_image_url text,            -- optional figure shown on the definition side
  unique (set_id, position)
);

create index if not exists flashcard_cards_set_idx on public.flashcard_cards(set_id);

-- Media columns were added after the first release. These ALTERs are idempotent,
-- so re-running this whole file upgrades an existing install in place.
alter table public.flashcard_cards add column if not exists term_image_url       text;
alter table public.flashcard_cards add column if not exists definition_image_url text;

-- ---------------------------------------------------------------------------
-- Row Level Security: service-role only (no policies/grants -> anon and the
-- publishable key cannot read or write). All access is via supabaseAdmin().
-- ---------------------------------------------------------------------------
alter table public.flashcard_sets  enable row level security;
alter table public.flashcard_cards enable row level security;

-- ---------------------------------------------------------------------------
-- updated_at trigger. touch_updated_at() is already defined by schema.sql /
-- drills.sql; redefined here (idempotent) so this file can run standalone.
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists flashcard_sets_touch on public.flashcard_sets;
create trigger flashcard_sets_touch before update on public.flashcard_sets
  for each row execute function public.touch_updated_at();

-- Force PostgREST to reload its schema cache so the new tables are reachable
-- immediately over the API (otherwise the first requests can 404 with PGRST205).
notify pgrst, 'reload schema';
