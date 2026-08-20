#!/usr/bin/env bash
# Apply the 1500 Blueprint schema + seed data to the local Supabase Postgres.
#
# The repository keeps its base schema in top-level supabase/*.sql files (meant to
# be pasted into the Supabase SQL editor) rather than as CLI migrations, so
# `supabase db reset` cannot bootstrap a fresh database on its own. This script
# applies those files in dependency order, then the timestamped migrations, then
# the seed data. Every referenced file is idempotent, so re-running is safe.
set -euo pipefail

DB_URL="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SUPA="$ROOT/supabase"

psql_run() {
  echo "-> applying ${1#"$ROOT/"}"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f "$1"
}

# Base schema, in dependency order (see the header comment in each file).
base_files=(
  schema.sql             # tests, modules, questions, choices
  auth.sql               # users, login_tokens, record_login()
  gamification.sql       # xp/levels/streaks + test_attempts, drill_attempts
  drills.sql             # sat_skills, drills, drill_questions, admins
  drill_progress.sql     # per-question progress + ai_monthly_usage
  module_attempts.sql    # single-module practice history
  test_persistence.sql   # extends test_attempts + test_sessions
  flashcard_sets.sql     # user/admin flashcard sets
  community.sql          # posts, comments, likes
  community_notifications.sql
)
for f in "${base_files[@]}"; do
  psql_run "$SUPA/$f"
done

# Timestamped migrations. Skip the practice-test underline patch: it edits DOCX-imported
# question passages that only exist after running the (source-file-dependent) importer,
# and its `select ... into strict` raises on an empty database.
for m in "$SUPA"/migrations/*.sql; do
  case "$m" in
    *restore_practice_test_underlines*)
      echo "-> skipping ${m#"$ROOT/"} (needs imported practice-test content)"
      ;;
    *)
      psql_run "$m"
      ;;
  esac
done

# Grant the service_role full access to the public schema. Hosted Supabase
# projects give service_role these privileges by default; the local stack's newer
# default does not auto-grant them (auto_expose_new_tables is off), so the app's
# supabaseAdmin() client (which uses the secret key -> service_role) would hit
# "permission denied" on the RLS-locked, server-only tables. service_role also has
# BYPASSRLS, so row access still matches production.
echo "-> granting service_role privileges on public schema"
psql "$DB_URL" -v ON_ERROR_STOP=1 -q <<'SQL'
grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all routines in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on routines to service_role;
SQL

# Storage bucket used for avatars, question figures, and community images.
echo "-> ensuring storage bucket 'figures'"
psql "$DB_URL" -v ON_ERROR_STOP=1 -q -c \
  "insert into storage.buckets (id, name, public) values ('figures','figures', true) on conflict (id) do nothing;"

# Seed data (drill catalog + demo community feed).
psql_run "$SUPA/drills_seed.sql"
psql_run "$SUPA/community_seed.sql"

echo "Database bootstrap complete."
