-- 1500 Blueprint — per-student drill question progress.
-- Tracks which questions each student has attempted and mastered, so the drill
-- players stop re-feeding mastered questions and the History tab can list past
-- work. Run AFTER auth.sql + drills.sql + gamification.sql. Safe to re-run.
-- Server-only: read/written with the secret (service-role) key; RLS on, no
-- public policies (same lockdown as gamification.sql).

create table if not exists public.drill_question_progress (
  email        text not null references public.users(email) on delete cascade,
  question_id  text not null references public.drill_questions(id) on delete cascade,
  drill_slug   text not null,
  attempts     integer not null default 0,
  best_score   integer,                     -- 0..100 for AI drills; null for objective drills
  mastered_at  timestamptz,                 -- set once, the first time the question is mastered
  last_seen_at timestamptz not null default now(),
  primary key (email, question_id)
);

-- Pool selection per student per drill (filter unmastered, order by last seen).
create index if not exists drill_qprogress_email_drill_idx
  on public.drill_question_progress(email, drill_slug);
-- History list: a student's most-recent questions first.
create index if not exists drill_qprogress_email_seen_idx
  on public.drill_question_progress(email, last_seen_at desc);

alter table public.drill_question_progress enable row level security;
