<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

This repo is **1500 Blueprint Drills**, a Next.js 16 (Turbopack) SAT prep app backed by a local Supabase stack (Postgres + Auth + Storage + Studio). The whole site is gated behind a session cookie by `proxy.ts`; only `/login` and `/api/auth/*` are reachable logged out.

**Environment is auto-provisioned by `.cursor/environment.json`** (Dockerfile + `.cursor/scripts/*`). On boot, `start-services.sh` starts the Docker daemon, brings up Supabase, applies the SQL schema/seed (`bootstrap-db.sh`), writes `.env.local` (`write-env-local.sh`), and the `dev` terminal runs `npm run dev` (port 3000). Standard scripts live in `package.json` (`dev`/`build`/`start`/`lint`/`test`).

Non-obvious gotchas:

- **Log in with the dev bypass** (no Stripe/email/magic-link needed): sign in at `/login` as `student@example.com` (regular student) or `admin@example.com` (admin CMS at `/admin`, access key `local-admin-key`). These are set via `DEV_BYPASS_EMAILS` in the generated `.env.local` and are inert in production.
- **Content is only partially seeded.** The bootstrap seeds 7 drills + a demo community feed, but **no practice tests and no drill questions**. So the Vocab/Grammar/Reading/AI-Math *drill players* and every Practice Test have no content offline. Populating them requires the DOCX importers under `scripts/import/*` plus `ANTHROPIC_API_KEY` (unset by default). For offline end-to-end testing use the **Flashcards** feature (create/study a deck) or the **Community** feed — both work with zero extra content.
- **Never restart `dockerd` while the Supabase containers are running.** Published ports are bound by per-container `docker-proxy` processes; loopback DNAT excludes `127.0.0.0/8`, so if the daemon restarts and re-adopts running containers the proxies are not respawned and `127.0.0.1:54321/54322` stop responding. To recover: `supabase stop`, kill `dockerd`, start a fresh `dockerd`, then `supabase start`.
- Local Supabase endpoints: API/PostgREST `http://127.0.0.1:54321`, Postgres `postgresql://postgres:postgres@127.0.0.1:54322/postgres`, Studio `http://127.0.0.1:54323`, Mailpit (captured magic-link emails) `http://127.0.0.1:54324`.
- `bootstrap-db.sh` is idempotent (re-running is safe) and grants `service_role` full access to `public` (the local stack does not auto-expose new tables), which the server-only `supabaseAdmin()` client relies on.
