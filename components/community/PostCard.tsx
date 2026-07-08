"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Author, CommunityPost } from "@/lib/community/types";
import { CATEGORY } from "@/lib/community/types";
import {
  CommentIcon,
  EyeIcon,
  HeartIcon,
  KebabIcon,
  ShareIcon,
  TrashIcon,
} from "./icons";
import { Avatar } from "./Avatar";
import { Attachment } from "./Attachment";
import { RichText } from "./RichText";

// Small level chip shown next to the author name (Whop puts a creator/verified
// badge here; our app is level-based, so surface the level).
function LevelBadge({ level }: { level: number }) {
  return (
    <span className="inline-flex flex-none items-center rounded-md bg-navy/[0.06] px-1.5 py-[1px] text-[10px] font-bold text-navy/55">
      Lv {level}
    </span>
  );
}

export function PostCard({
  post,
  currentUser,
  isAdmin = false,
  onDelete,
}: {
  post: CommunityPost;
  currentUser: Author;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const cat = CATEGORY[post.category];
  const canDelete = isAdmin || post.authorHandle === currentUser.handle;

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

  async function remove() {
    setMenuOpen(false);
    setBusy(true);
    try {
      const res = await fetch(`/api/community/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onDelete?.(post.id);
    } catch {
      setBusy(false);
    }
  }

  return (
    <article
      className={`rounded-xl border border-navy/10 bg-white transition-colors hover:border-navy/[0.16] ${
        busy ? "pointer-events-none opacity-50" : ""
      }`}
    >
      <div className="px-4 pt-3.5">
        <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-navy/45">
          <span className={`h-1.5 w-1.5 rounded-full ${cat.dot}`} />
          {cat.label}
        </div>

        <div className="flex items-center gap-2.5">
          <Avatar src={post.author.avatarUrl} initials={post.author.initials} alt={post.author.name} size={38} />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[14px] font-bold text-ink">{post.author.name}</span>
              <LevelBadge level={post.author.level} />
            </div>
            <div className="truncate text-[12px] text-navy/45">
              @{post.author.handle} · {post.timeAgo}
            </div>
          </div>

          {canDelete && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Post options"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="-mr-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-navy/40 transition-colors hover:bg-navy/[0.06] hover:text-navy"
              >
                <KebabIcon className="h-[18px] w-[18px]" />
              </button>
              {menuOpen && (
                <>
                  <button
                    type="button"
                    aria-hidden
                    tabIndex={-1}
                    onClick={() => setMenuOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  />
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-navy/12 bg-white shadow-xl"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={remove}
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
        </div>

        {/* Body navigates to the thread on click; inner links stopPropagation,
            so a URL in a post opens the URL, not the thread. (A nested <Link>
            here would render invalid <a>-in-<a> around RichText links.) */}
        <div
          onClick={() => router.push(`/community/${post.id}`)}
          className="mt-2.5 block cursor-pointer"
        >
          <RichText text={post.body} className="text-[14px] leading-[1.6] text-ink/85" />
          {post.shot && <Attachment shot={post.shot} />}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 px-4 pb-3">
        <button
          type="button"
          onClick={toggleLike}
          aria-label={liked ? "Unlike" : "Like"}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors ${
            liked
              ? "border-danger/25 bg-danger-bg text-danger"
              : "border-navy/12 text-navy/60 hover:bg-navy/[0.04]"
          }`}
        >
          <HeartIcon className="h-[17px] w-[17px]" filled={liked} />
          {likes}
        </button>
        <Link
          href={`/community/${post.id}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-navy/12 px-3 py-1.5 text-[13px] font-semibold text-navy/60 transition-colors hover:bg-navy/[0.04]"
        >
          <CommentIcon className="h-[17px] w-[17px]" />
          {post.commentCount}
        </Link>

        <div className="ml-auto flex items-center gap-3 text-navy/40">
          <span className="inline-flex items-center gap-1 text-[12.5px] font-medium">
            <EyeIcon className="h-4 w-4" />
            {post.views}
          </span>
          <button
            type="button"
            aria-label="Share"
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] font-semibold text-navy/55 transition-colors hover:bg-navy/[0.04] hover:text-navy"
          >
            <ShareIcon className="h-[17px] w-[17px]" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      <Link
        href={`/community/${post.id}`}
        className="flex items-center gap-2.5 border-t border-navy/[0.07] px-4 py-2.5"
      >
        <Avatar src={currentUser.avatarUrl} initials={currentUser.initials} size={28} />
        <span className="flex-1 rounded-full bg-haze px-3.5 py-1.5 text-[13px] text-navy/45">
          Write a comment…
        </span>
      </Link>
    </article>
  );
}
