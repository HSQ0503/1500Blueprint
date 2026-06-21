-- 1500 Blueprint — drill CMS schema (admin editor + runtime reader).
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to re-run (idempotent).
-- Runtime reads use the publishable (anon) key via RLS and see ONLY published rows;
-- the admin editor writes with the secret (service-role) key, which bypasses RLS.
-- Mirrors the conventions in supabase/schema.sql exactly.

-- ---------------------------------------------------------------------------
-- 1. sat_skills — canonical taxonomy reference (section > domain > skill).
--    A TABLE (not a Postgres enum) so the 29 skills can grow (e.g. a future
--    Command of Evidence Textual/Quantitative split) without a type migration,
--    and so the editor can SELECT it to build cascading section->domain->skill
--    dropdowns. drill_questions.skill stays plain text (no FK) so legacy import
--    aliases still load; this table is the authoritative picker source.
-- ---------------------------------------------------------------------------
create table if not exists public.sat_skills (
  id          text primary key default gen_random_uuid()::text,
  section     text not null,                 -- 'rw' | 'math'
  domain      text not null,                 -- one of the 4 domains for the section
  name        text not null,                 -- exact official skill name
  sort        int  not null default 0,       -- display order within the domain
  created_at  timestamptz not null default now(),
  unique (section, domain, name)
);

create index if not exists sat_skills_section_idx on public.sat_skills(section);
create index if not exists sat_skills_domain_idx  on public.sat_skills(domain);

-- ---------------------------------------------------------------------------
-- 2. drills — one row per drill TYPE. Holds the editable, per-drill injected
--    grading prompt and scoring config. The editor edits grading_prompt +
--    scoring_config here; questions FK to slug.
-- ---------------------------------------------------------------------------
create table if not exists public.drills (
  slug            text primary key,          -- 'grammar' | 'reading' | ... (stable, human-readable)
  title           text not null,             -- 'Grammar Drill'
  category        text not null,             -- 'Writing' | 'Reading' | 'Math' | 'Vocabulary'
  accent          text not null default 'brand', -- 'brand' | 'navy' | 'gold' | 'sky'
  uses_ai         boolean not null default false,
  ai_role         text not null default 'none',  -- 'none' | 'grade-process' | 'grade-summary' | 'generate'
  answer_types    text[] not null default '{}',  -- allowed answer types for this drill
  grading_prompt  text,                      -- editable AI grading prompt (null for non-AI drills)
  scoring_config  jsonb not null default '{}'::jsonb, -- thresholds, lives, timers, mastery targets, etc.
  sort            int  not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. drill_questions — one row per authored item across ALL 7 drill types.
--    Common, filterable fields are real columns (so the question-bank list can
--    filter/sort/paginate in SQL); heterogeneous per-drill payload (choices,
--    accepted answers, keyPoints, verbs, pos, example, kind, ...) lives in the
--    `content` jsonb, read whole by the matching drill component.
-- ---------------------------------------------------------------------------
create table if not exists public.drill_questions (
  id           text primary key default gen_random_uuid()::text,
  drill_slug   text not null references public.drills(slug) on delete cascade,
  section      text,                          -- 'rw' | 'math' (null for vocab/flashcards)
  domain       text,                          -- canonical domain (null where N/A)
  skill        text,                          -- canonical skill name (null where N/A)
  difficulty   text not null default 'medium',-- 'easy' | 'medium' | 'hard'
  answer_type  text not null,                 -- 'mc_single' | 'grid_in' | 'multi_select' | 'free_text' | 'spaced_repetition'
  stem         text,                          -- question prompt / stem (the asked question)
  passage      text,                          -- stimulus / context / scenario (optional)
  figure_url   text,                          -- Supabase Storage public URL (optional)
  content      jsonb not null default '{}'::jsonb, -- drill-specific payload (choices, accepted, keyPoints, ...)
  explanation  text,                          -- worked solution / rationale (optional)
  status       text not null default 'draft', -- 'draft' | 'published'
  created_by   text,                          -- admin email that authored it
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists drill_questions_drill_idx  on public.drill_questions(drill_slug);
create index if not exists drill_questions_status_idx  on public.drill_questions(status);
create index if not exists drill_questions_skill_idx   on public.drill_questions(skill);
create index if not exists drill_questions_diff_idx    on public.drill_questions(difficulty);
-- Hot runtime path: published items for one drill.
create index if not exists drill_questions_pub_idx     on public.drill_questions(drill_slug, status);

-- ---------------------------------------------------------------------------
-- 4. drill_walkthrough_steps — editable critical-path steps for AI process
--    grading (Grammar today; any future grade-process drill). Ordered by
--    position; kind is 'normal' or 'confirm_option'. Normalized (not in content
--    jsonb) so the step editor can add/reorder/delete rows cleanly.
-- ---------------------------------------------------------------------------
create table if not exists public.drill_walkthrough_steps (
  id           text primary key default gen_random_uuid()::text,
  question_id  text not null references public.drill_questions(id) on delete cascade,
  position     int  not null,                 -- 1-based order in the critical path
  kind         text not null default 'normal',-- 'normal' | 'confirm_option'
  text         text not null,                 -- the step instruction shown/graded
  detail       text,                          -- optional elaboration / expected evidence
  unique (question_id, position)
);

create index if not exists walkthrough_question_idx on public.drill_walkthrough_steps(question_id);

-- ---------------------------------------------------------------------------
-- 5. admins — email allowlist for the CMS. RLS on, NO policies/grants -> only
--    the service-role key reaches it (same lockdown as auth.sql tables). The
--    proxy gate uses the ADMIN_EMAILS env allowlist for the fast edge check;
--    this table is the optional DB-backed source for server-side double-checks
--    and lets you add admins without a redeploy later.
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  email       text primary key,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
--   Content (sat_skills, drills, drill_questions, drill_walkthrough_steps):
--   public READ, but drill_questions/steps are gated to status='published' so
--   the anon key never sees drafts. Writes only via service-role (no insert/
--   update/delete policy -> anon/authenticated cannot write).
--   admins: locked to service-role only.
-- ---------------------------------------------------------------------------
alter table public.sat_skills              enable row level security;
alter table public.drills                  enable row level security;
alter table public.drill_questions         enable row level security;
alter table public.drill_walkthrough_steps enable row level security;
alter table public.admins                  enable row level security;

drop policy if exists "public read sat_skills"   on public.sat_skills;
drop policy if exists "public read drills"        on public.drills;
drop policy if exists "public read pub questions" on public.drill_questions;
drop policy if exists "public read pub steps"     on public.drill_walkthrough_steps;

create policy "public read sat_skills" on public.sat_skills for select using (true);
create policy "public read drills"      on public.drills      for select using (true);
-- Only published questions are anon-readable.
create policy "public read pub questions" on public.drill_questions
  for select using (status = 'published');
-- Steps readable only when their parent question is published.
create policy "public read pub steps" on public.drill_walkthrough_steps
  for select using (
    exists (
      select 1 from public.drill_questions q
      where q.id = drill_walkthrough_steps.question_id
        and q.status = 'published'
    )
  );

-- Grants: anon/authenticated may SELECT content tables only.
grant select on public.sat_skills, public.drill_questions,
  public.drill_walkthrough_steps to anon, authenticated;
-- drills: COLUMN-level grant so the anon/publishable key can NEVER read
-- grading_prompt (Scott's IP). RLS controls which rows; column grants control
-- which columns. The admin CMS uses the service-role key, which bypasses both.
revoke select on public.drills from anon, authenticated;
grant select (slug, title, category, accent, uses_ai, ai_role, answer_types,
  scoring_config, sort, created_at, updated_at) on public.drills to anon, authenticated;
-- admins: no grants -> service-role only.

-- ---------------------------------------------------------------------------
-- updated_at trigger (drills + drill_questions). Idempotent.
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

drop trigger if exists drills_touch on public.drills;
create trigger drills_touch before update on public.drills
  for each row execute function public.touch_updated_at();

drop trigger if exists drill_questions_touch on public.drill_questions;
create trigger drill_questions_touch before update on public.drill_questions
  for each row execute function public.touch_updated_at();
