-- 1500 Blueprint — Community notifications (mentions + comment replies).
-- Paste into Supabase → SQL Editor → New query → Run. Safe to re-run (idempotent).
--
-- Access model: service-role only, same lockdown as community.sql — RLS on, no
-- policies or grants. All reads/writes go through supabaseAdmin() in
-- lib/community/notifications.ts. A row is created when someone @mentions a
-- member in a post/comment, or replies to a member's comment. The homepage bell
-- (components/shell/NotificationBell) reads the recipient's rows.

create table if not exists public.community_notifications (
  id              text primary key default gen_random_uuid()::text,
  recipient_email text not null,
  actor_email     text not null,
  actor_name      text not null default '',
  actor_handle    text not null default '',
  kind            text not null default 'mention',  -- mention | reply
  post_id         text references public.community_posts(id)    on delete cascade,
  comment_id      text references public.community_comments(id) on delete cascade,
  excerpt         text not null default '',
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists community_notifs_recipient_idx
  on public.community_notifications(recipient_email, created_at desc);
-- Partial index for the unread badge count (the hot path on every page load).
create index if not exists community_notifs_unread_idx
  on public.community_notifications(recipient_email) where read_at is null;

-- Service-role only: RLS on with no policies/grants.
alter table public.community_notifications enable row level security;

-- ---------------------------------------------------------------------------
-- Resolve @handles back to member emails. A handle is snapshot as
-- split_part(email,'@',1) at post time, so we match the same way, lowercased.
-- A local-part can repeat across domains in principle, so every match is
-- returned (all get notified). Input is a lowercased text[] of bare handles.
-- ---------------------------------------------------------------------------
create or replace function public.community_resolve_handles(p_handles text[])
returns table (email text, handle text)
language sql
stable
as $$
  select email, lower(split_part(email, '@', 1)) as handle
  from public.users
  where lower(split_part(email, '@', 1)) = any(p_handles);
$$;

-- Force PostgREST to reload its schema cache so the new table/function are
-- reachable immediately over the API (otherwise the first requests can 404).
notify pgrst, 'reload schema';
