"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Author, CommunityPost, PostComment } from "@/lib/community/types";
import { CATEGORY } from "@/lib/community/types";
import { BackIcon, CommentIcon, EyeIcon, HeartIcon, KebabIcon, ShareIcon, TrashIcon } from "./icons";
import { Avatar } from "./Avatar";
import { Attachment } from "./Attachment";
import { RichText } from "./RichText";

// Who a reply composer is aimed at: always threads under a ROOT comment (one
// level deep); `handle` is who gets the @mention prefill.
type ReplyTarget = { rootId: string; handle: string };

function ReplyComposer({
  user,
  target,
  onSubmit,
  onCancel,
  posting,
}: {
  user: Author;
  target: ReplyTarget;
  onSubmit: (body: string) => void;
  onCancel: () => void;
  posting: boolean;
}) {
  const [draft, setDraft] = useState(`@${target.handle} `);

  return (
    <div className="mt-2 flex items-start gap-2">
      <Avatar src={user.avatarUrl} initials={user.initials} size={26} />
      <div className="flex-1">
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder={`Reply to @${target.handle}…`}
          // Put the caret after the prefilled mention on mount.
          onFocus={(e) => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
          className="w-full resize-none rounded-lg bg-haze px-3 py-2 text-[13.5px] leading-[1.55] text-ink outline-none ring-brand/40 transition-shadow placeholder:text-navy/40 focus:ring-2"
        />
        <div className="mt-1.5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-navy/60 transition-colors hover:bg-navy/[0.06]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSubmit(draft)}
            disabled={!draft.trim() || posting}
            className="rounded-lg bg-brand px-3.5 py-1.5 text-[12.5px] font-bold text-white shadow-[0_2px_0_#2b8fe0] transition-transform active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            {posting ? "Replying…" : "Reply"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CommentBody({
  comment,
  size,
  canModerate,
  onDelete,
  onReply,
}: {
  comment: PostComment;
  size: number;
  canModerate: boolean;
  onDelete: (id: string) => void;
  onReply: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(`/api/community/comments/${comment.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onDelete(comment.id);
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className={`group flex gap-2.5 ${busy ? "opacity-50" : ""}`}>
      <Avatar src={comment.author.avatarUrl} initials={comment.author.initials} alt={comment.author.name} size={size} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 leading-tight">
          <span className="text-[13.5px] font-bold text-ink">{comment.author.name}</span>
          <span className="text-[12px] text-navy/45">
            @{comment.author.handle} · {comment.timeAgo}
          </span>
          {canModerate && (
            <button
              type="button"
              onClick={remove}
              aria-label="Delete comment"
              className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full text-navy/30 transition-colors hover:bg-danger-bg hover:text-danger sm:opacity-0 sm:group-hover:opacity-100"
            >
              <TrashIcon className="h-[15px] w-[15px]" />
            </button>
          )}
        </div>
        <RichText text={comment.body} className="mt-1 text-[14px] leading-[1.55] text-ink/85" />
        <button
          type="button"
          onClick={onReply}
          className="mt-1 text-[12px] font-bold text-navy/45 transition-colors hover:text-navy"
        >
          Reply
        </button>
      </div>
    </div>
  );
}

export function PostDetail({
  post,
  user,
  isAdmin,
}: {
  post: CommunityPost;
  user: Author;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [comments, setComments] = useState<PostComment[]>(post.comments ?? []);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const cat = CATEGORY[post.category];
  const canModeratePost = isAdmin || post.authorHandle === user.handle;

  // One-level threads: top-level comments in order, replies grouped under them.
  const thread = useMemo(() => {
    const roots = comments.filter((c) => !c.parentId);
    const replies = new Map<string, PostComment[]>();
    for (const c of comments) {
      if (!c.parentId) continue;
      const list = replies.get(c.parentId) ?? [];
      list.push(c);
      replies.set(c.parentId, list);
    }
    return { roots, replies };
  }, [comments]);

  async function toggleLike() {
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    try {
      const res = await fetch(`/api/community/posts/${post.id}/like`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { liked: boolean; likes: number };
      setLiked(Boolean(data.liked));
      setLikes(Number(data.likes));
    } catch {
      setLiked(!next);
      setLikes((n) => n + (next ? -1 : 1));
    }
  }

  async function submitComment(body: string, parentId: string | null) {
    const text = body.trim();
    if (!text || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/community/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text, parentId }),
      });
      if (!res.ok) throw new Error();
      const { comment } = (await res.json()) as { comment: PostComment };
      setComments((prev) => [...prev, comment]);
      if (parentId) setReplyTo(null);
      else setDraft("");
    } catch {
      // leave the draft in place so nothing is lost
    } finally {
      setPosting(false);
    }
  }

  // Deleting a root also removes its replies locally (the DB cascades).
  function removeComment(id: string) {
    setComments((prev) => prev.filter((c) => c.id !== id && c.parentId !== id));
  }

  async function deletePost() {
    setMenuOpen(false);
    try {
      const res = await fetch(`/api/community/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push("/community");
      router.refresh();
    } catch {
      // no-op; the post stays on screen
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Link
        href="/community"
        className="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-navy/60 transition-colors hover:text-navy"
      >
        <BackIcon className="h-4 w-4" />
        Back to community
      </Link>

      <article className="rounded-xl border border-navy/10 bg-white p-4 sm:p-5">
        <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-navy/45">
          <span className={`h-1.5 w-1.5 rounded-full ${cat.dot}`} />
          {cat.label}
        </div>

        <header className="flex items-center gap-2.5">
          <Avatar src={post.author.avatarUrl} initials={post.author.initials} alt={post.author.name} size={42} />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[15px] font-bold text-ink">{post.author.name}</span>
              <span className="inline-flex flex-none items-center rounded-md bg-navy/[0.06] px-1.5 py-[1px] text-[10px] font-bold text-navy/55">
                Lv {post.author.level}
              </span>
            </div>
            <div className="truncate text-[12px] text-navy/45">
              @{post.author.handle} · {post.timeAgo}
            </div>
          </div>

          {canModeratePost && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Post options"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-navy/40 transition-colors hover:bg-navy/[0.06] hover:text-navy"
              >
                <KebabIcon className="h-[18px] w-[18px]" />
              </button>
              {menuOpen && (
                <>
                  <button type="button" aria-hidden tabIndex={-1} onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40 cursor-default" />
                  <div role="menu" className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-navy/12 bg-white shadow-xl">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={deletePost}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-danger transition-colors hover:bg-danger-bg"
                    >
                      <TrashIcon className="h-[17px] w-[17px]" />
                      Delete post
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </header>

        <RichText text={post.body} className="mt-3 text-[15px] leading-[1.65] text-ink/90" />
        {post.shot && <Attachment shot={post.shot} />}

        <div className="mt-4 flex items-center gap-2 border-t border-navy/[0.07] pt-3">
          <button
            type="button"
            onClick={toggleLike}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
              liked ? "border-danger/25 bg-danger-bg text-danger" : "border-navy/12 text-navy/60 hover:bg-navy/[0.04]"
            }`}
          >
            <HeartIcon className="h-[17px] w-[17px]" filled={liked} />
            {likes}
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-navy/12 px-3.5 py-1.5 text-[13px] font-semibold text-navy/60">
            <CommentIcon className="h-[17px] w-[17px]" />
            {comments.length}
          </span>
          <div className="ml-auto flex items-center gap-3 text-navy/40">
            <span className="inline-flex items-center gap-1 text-[12.5px] font-medium">
              <EyeIcon className="h-4 w-4" />
              {post.views}
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] font-semibold text-navy/55 transition-colors hover:bg-navy/[0.04] hover:text-navy"
            >
              <ShareIcon className="h-[17px] w-[17px]" />
              Share
            </button>
          </div>
        </div>
      </article>

      <div className="rounded-xl border border-navy/10 bg-white p-4">
        <div className="flex items-center justify-between border-b border-navy/[0.07] pb-3">
          <h2 className="font-display text-[15px] font-bold text-navy">
            {comments.length} {comments.length === 1 ? "comment" : "comments"}
          </h2>
          <span className="text-[12.5px] font-semibold text-navy/45">Newest</span>
        </div>

        <div className="flex items-start gap-2.5 pt-3">
          <Avatar src={user.avatarUrl} initials={user.initials} size={34} />
          <div className="flex-1">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              placeholder="Add a comment…"
              className="w-full resize-none rounded-lg bg-haze px-3.5 py-2.5 text-[14px] leading-[1.55] text-ink outline-none ring-brand/40 transition-shadow placeholder:text-navy/40 focus:ring-2"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => submitComment(draft, null)}
                disabled={!draft.trim() || posting}
                className="rounded-lg bg-brand px-4 py-2 text-[13px] font-bold text-white shadow-[0_2px_0_#2b8fe0] transition-transform active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                {posting ? "Posting…" : "Comment"}
              </button>
            </div>
          </div>
        </div>

        {thread.roots.length > 0 && (
          <div className="mt-1 divide-y divide-navy/[0.07] border-t border-navy/[0.07]">
            {thread.roots.map((c) => {
              const replies = thread.replies.get(c.id) ?? [];
              return (
                <div key={c.id} className="py-3.5">
                  <CommentBody
                    comment={c}
                    size={34}
                    canModerate={isAdmin || c.authorHandle === user.handle}
                    onDelete={removeComment}
                    onReply={() => setReplyTo({ rootId: c.id, handle: c.author.handle })}
                  />

                  {/* Replies: indented under the root with a thread line. */}
                  {(replies.length > 0 || replyTo?.rootId === c.id) && (
                    <div className="ml-[17px] mt-2.5 flex flex-col gap-3 border-l-2 border-navy/[0.08] pl-[22px]">
                      {replies.map((r) => (
                        <CommentBody
                          key={r.id}
                          comment={r}
                          size={26}
                          canModerate={isAdmin || r.authorHandle === user.handle}
                          onDelete={removeComment}
                          onReply={() => setReplyTo({ rootId: c.id, handle: r.author.handle })}
                        />
                      ))}
                      {replyTo?.rootId === c.id && (
                        <ReplyComposer
                          user={user}
                          target={replyTo}
                          posting={posting}
                          onSubmit={(body) => submitComment(body, c.id)}
                          onCancel={() => setReplyTo(null)}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
