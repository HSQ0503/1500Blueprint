// Server-only data layer for the community board. Uses the service-role key
// (supabaseAdmin) which bypasses RLS, so callers MUST authorize first
// (getSession / moderation checks) — never import this into a Client Component.
// Mirrors lib/flashcards/queries.ts.

import { supabaseAdmin } from "@/utils/supabase/admin";
import { isAdminEmail } from "@/lib/auth/admin";
import type {
  Author,
  CommunityCategory,
  CommunityPost,
  PostComment,
  TopMember,
} from "./types";

// Author snapshot written onto a post/comment (email + display fields).
export type PostAuthor = Author & { email: string };

type PostRow = {
  id: string;
  author_email: string;
  author_name: string;
  author_initials: string;
  author_handle: string;
  author_level: number;
  category: string;
  body: string;
  image_url: string | null;
  view_count: number;
  created_at: string;
  community_comments?: { count: number }[] | null;
  community_likes?: { count: number }[] | null;
};

type CommentRow = {
  id: string;
  author_name: string;
  author_initials: string;
  author_handle: string;
  author_level: number;
  body: string;
  created_at: string;
};

const POST_BASE =
  "id,author_email,author_name,author_initials,author_handle,author_level,category,body,image_url,view_count,created_at";
const POST_SELECT = `${POST_BASE},community_comments(count),community_likes(count)`;

const COMMENT_SELECT =
  "id,author_name,author_initials,author_handle,author_level,body,created_at";

// Relative timestamp for the feed ("now", "3h", "2d", "Jul 1").
function relativeTime(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function mapPost(row: PostRow, liked: Set<string>): CommunityPost {
  return {
    id: row.id,
    author: {
      name: row.author_name,
      handle: row.author_handle,
      initials: row.author_initials,
      level: row.author_level,
    },
    authorHandle: row.author_handle,
    category: row.category as CommunityCategory,
    timeAgo: relativeTime(row.created_at),
    body: row.body,
    shot: row.image_url
      ? { kind: "image", url: row.image_url, alt: `Screenshot from ${row.author_name}` }
      : undefined,
    likes: row.community_likes?.[0]?.count ?? 0,
    liked: liked.has(row.id),
    commentCount: row.community_comments?.[0]?.count ?? 0,
    views: row.view_count,
  };
}

function mapComment(row: CommentRow): PostComment {
  return {
    id: row.id,
    author: {
      name: row.author_name,
      handle: row.author_handle,
      initials: row.author_initials,
      level: row.author_level,
    },
    authorHandle: row.author_handle,
    timeAgo: relativeTime(row.created_at),
    body: row.body,
  };
}

// Which of the given post ids the viewer has liked.
async function likedIdsFor(email: string, postIds: string[]): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();
  const { data } = await supabaseAdmin()
    .from("community_likes")
    .select("post_id")
    .eq("email", email)
    .in("post_id", postIds);
  return new Set((data as { post_id: string }[] | null)?.map((r) => r.post_id) ?? []);
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function listPosts(
  viewerEmail: string,
  category?: CommunityCategory,
): Promise<CommunityPost[]> {
  let query = supabaseAdmin()
    .from("community_posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false })
    .limit(100);
  if (category) query = query.eq("category", category);

  const { data } = await query;
  const rows = (data as PostRow[] | null) ?? [];
  const liked = await likedIdsFor(viewerEmail, rows.map((r) => r.id));
  return rows.map((r) => mapPost(r, liked));
}

export async function getPost(id: string, viewerEmail: string): Promise<CommunityPost | null> {
  const db = supabaseAdmin();
  const { data } = await db.from("community_posts").select(POST_SELECT).eq("id", id).maybeSingle();
  const row = data as PostRow | null;
  if (!row) return null;

  const liked = await likedIdsFor(viewerEmail, [id]);
  const post = mapPost(row, liked);

  // Load the thread and bump the view counter in parallel. The increment is
  // best-effort — a failure (or a missing function pre-migration) never breaks
  // the render.
  const [{ data: comments }] = await Promise.all([
    db.from("community_comments").select(COMMENT_SELECT).eq("post_id", id).order("created_at", { ascending: true }),
    db.rpc("increment_post_views", { pid: id }).then(
      () => {},
      () => {},
    ),
  ]);
  post.comments = (comments as CommentRow[] | null)?.map(mapComment) ?? [];

  return post;
}

export async function listTopMembers(limit = 4): Promise<TopMember[]> {
  const { data } = await supabaseAdmin().rpc("community_top_members", { lim: limit });
  const rows = (data as
    | { author_name: string; author_initials: string; author_level: number; post_count: number }[]
    | null) ?? [];
  return rows.map((r) => ({
    name: r.author_name,
    initials: r.author_initials,
    level: r.author_level,
    postCount: Number(r.post_count),
  }));
}

// ---------------------------------------------------------------------------
// Moderation checks
// ---------------------------------------------------------------------------

export async function canModeratePost(id: string, email: string): Promise<boolean> {
  if (isAdminEmail(email)) return true;
  const { data } = await supabaseAdmin()
    .from("community_posts")
    .select("author_email")
    .eq("id", id)
    .maybeSingle();
  return (data as { author_email: string } | null)?.author_email === email;
}

export async function canModerateComment(id: string, email: string): Promise<boolean> {
  if (isAdminEmail(email)) return true;
  const { data } = await supabaseAdmin()
    .from("community_comments")
    .select("author_email")
    .eq("id", id)
    .maybeSingle();
  return (data as { author_email: string } | null)?.author_email === email;
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function createPost(
  author: PostAuthor,
  input: { category: CommunityCategory; body: string; imageUrl: string | null },
): Promise<CommunityPost | null> {
  const { data, error } = await supabaseAdmin()
    .from("community_posts")
    .insert({
      author_email: author.email,
      author_name: author.name,
      author_initials: author.initials,
      author_handle: author.handle,
      author_level: author.level,
      category: input.category,
      body: input.body,
      image_url: input.imageUrl,
    })
    .select(POST_BASE)
    .single();
  if (error || !data) return null;
  const post = mapPost(data as PostRow, new Set());
  post.comments = [];
  return post;
}

export async function deletePost(id: string): Promise<void> {
  await supabaseAdmin().from("community_posts").delete().eq("id", id); // comments + likes cascade
}

export async function addComment(
  postId: string,
  author: PostAuthor,
  body: string,
): Promise<PostComment | null> {
  const { data, error } = await supabaseAdmin()
    .from("community_comments")
    .insert({
      post_id: postId,
      author_email: author.email,
      author_name: author.name,
      author_initials: author.initials,
      author_handle: author.handle,
      author_level: author.level,
      body,
    })
    .select(COMMENT_SELECT)
    .single();
  if (error || !data) return null;
  return mapComment(data as CommentRow);
}

export async function deleteComment(id: string): Promise<void> {
  await supabaseAdmin().from("community_comments").delete().eq("id", id);
}

// Toggle a like for (post, email); returns the new state + fresh count.
export async function toggleLike(
  postId: string,
  email: string,
): Promise<{ liked: boolean; likes: number }> {
  const db = supabaseAdmin();
  const { data: existing } = await db
    .from("community_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("email", email)
    .maybeSingle();

  let liked: boolean;
  if (existing) {
    await db.from("community_likes").delete().eq("id", (existing as { id: string }).id);
    liked = false;
  } else {
    await db.from("community_likes").insert({ post_id: postId, email });
    liked = true;
  }

  const { count } = await db
    .from("community_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);
  return { liked, likes: count ?? 0 };
}
