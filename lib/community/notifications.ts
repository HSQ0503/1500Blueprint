// Server-only: creates + reads community notifications (mentions & replies).
// Uses supabaseAdmin (service role, bypasses RLS) — never import into a Client
// Component. Best-effort by design: a notification write must never block the
// post/comment that triggered it, so the fan-out helpers swallow their own
// errors and callers can await them without a try/catch.

import { supabaseAdmin } from "@/utils/supabase/admin";
import { relativeTime } from "./queries";
import type { CommunityNotification } from "./types";

type Actor = { email: string; name: string; handle: string };
type Kind = "mention" | "reply";

// @handles in a body: same rule as RichText's tokenizer — @ at a word boundary
// (start / whitespace / "(") so emails like scott@gmail.com never count.
// Returned lowercased, without the @, de-duplicated.
const MENTION = /(?<=^|[\s(])@([a-zA-Z0-9._-]*[a-zA-Z0-9])/g;

export function extractHandles(text: string): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(MENTION)) found.add(m[1].toLowerCase());
  return [...found];
}

// Resolve @handles to member emails via community_resolve_handles.
async function emailsForHandles(handles: string[]): Promise<string[]> {
  if (handles.length === 0) return [];
  const { data } = await supabaseAdmin().rpc("community_resolve_handles", { p_handles: handles });
  return ((data as { email: string }[] | null) ?? []).map((r) => r.email);
}

function excerptOf(body: string): string {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length > 120 ? `${flat.slice(0, 119)}…` : flat;
}

type NewNotif = {
  recipient_email: string;
  actor_email: string;
  actor_name: string;
  actor_handle: string;
  kind: Kind;
  post_id: string | null;
  comment_id: string | null;
  excerpt: string;
};

async function insertNotifications(rows: NewNotif[]): Promise<void> {
  if (rows.length === 0) return;
  try {
    await supabaseAdmin().from("community_notifications").insert(rows);
  } catch {
    // best-effort; a missing table (pre-migration) or write error is non-fatal
  }
}

// The author_email of a comment — used to notify who a reply is aimed at.
export async function commentAuthorEmail(commentId: string): Promise<string | null> {
  const { data } = await supabaseAdmin()
    .from("community_comments")
    .select("author_email")
    .eq("id", commentId)
    .maybeSingle();
  return (data as { author_email: string } | null)?.author_email ?? null;
}

// ---------------------------------------------------------------------------
// Fan-out (called from the write routes after a successful insert)
// ---------------------------------------------------------------------------

// A new post: notify everyone @mentioned in it, except the author.
export async function notifyForPost(actor: Actor, postId: string, body: string): Promise<void> {
  try {
    const emails = (await emailsForHandles(extractHandles(body))).filter((e) => e !== actor.email);
    await insertNotifications(
      [...new Set(emails)].map((email) => ({
        recipient_email: email,
        actor_email: actor.email,
        actor_name: actor.name,
        actor_handle: actor.handle,
        kind: "mention",
        post_id: postId,
        comment_id: null,
        excerpt: excerptOf(body),
      })),
    );
  } catch {
    // best-effort
  }
}

// A new comment: notify @mentions in it AND the author of the comment it replies
// to. One notification per recipient (a reply outranks a mention), never the actor.
export async function notifyForComment(
  actor: Actor,
  postId: string,
  commentId: string,
  body: string,
  replyToEmail: string | null,
): Promise<void> {
  try {
    const byEmail = new Map<string, Kind>();
    for (const email of await emailsForHandles(extractHandles(body))) byEmail.set(email, "mention");
    if (replyToEmail) byEmail.set(replyToEmail, "reply");
    byEmail.delete(actor.email);

    const excerpt = excerptOf(body);
    await insertNotifications(
      [...byEmail].map(([email, kind]) => ({
        recipient_email: email,
        actor_email: actor.email,
        actor_name: actor.name,
        actor_handle: actor.handle,
        kind,
        post_id: postId,
        comment_id: commentId,
        excerpt,
      })),
    );
  } catch {
    // best-effort
  }
}

// ---------------------------------------------------------------------------
// Reads (homepage bell)
// ---------------------------------------------------------------------------

type NotifRow = {
  id: string;
  kind: string;
  actor_name: string;
  actor_handle: string;
  post_id: string | null;
  excerpt: string;
  read_at: string | null;
  created_at: string;
};

export async function listNotifications(
  email: string,
  limit = 20,
): Promise<{ items: CommunityNotification[]; unread: number }> {
  const db = supabaseAdmin();
  const [{ data }, { count }] = await Promise.all([
    db
      .from("community_notifications")
      .select("id,kind,actor_name,actor_handle,post_id,excerpt,read_at,created_at")
      .eq("recipient_email", email)
      .order("created_at", { ascending: false })
      .limit(limit),
    db
      .from("community_notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_email", email)
      .is("read_at", null),
  ]);
  const rows = (data as NotifRow[] | null) ?? [];
  return {
    items: rows.map((r) => ({
      id: r.id,
      kind: r.kind === "reply" ? "reply" : "mention",
      actorName: r.actor_name,
      actorHandle: r.actor_handle,
      postId: r.post_id,
      excerpt: r.excerpt,
      timeAgo: relativeTime(r.created_at),
      read: r.read_at !== null,
    })),
    unread: count ?? 0,
  };
}

// Mark read for this member. With ids, only those; otherwise all unread rows.
export async function markNotificationsRead(email: string, ids?: string[]): Promise<void> {
  let q = supabaseAdmin()
    .from("community_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_email", email)
    .is("read_at", null);
  if (ids && ids.length > 0) q = q.in("id", ids);
  await q;
}
