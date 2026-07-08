import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getHubState } from "@/lib/gamification/state";
import { createPost } from "@/lib/community/queries";
import { notifyForPost } from "@/lib/community/notifications";
import { isCategory } from "@/lib/community/types";

// Create a community post. Any signed-in member can post; the author display
// fields are snapshot from their current hub profile.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    category?: string;
    body?: string;
    imageUrl?: string | null;
  };
  const text = (body.body ?? "").trim();
  const imageUrl = typeof body.imageUrl === "string" && body.imageUrl ? body.imageUrl : null;
  if (!text && !imageUrl) return NextResponse.json({ error: "empty" }, { status: 400 });

  const category = isCategory(body.category) ? body.category : "general";
  const hub = await getHubState(session.email);
  const author = {
    email: session.email,
    name: hub.player.name,
    initials: hub.player.initials,
    handle: session.email.split("@")[0],
    level: hub.player.level,
    avatarUrl: hub.player.avatarUrl,
  };

  const post = await createPost(author, { category, body: text, imageUrl });
  if (!post) return NextResponse.json({ error: "create_failed" }, { status: 500 });

  // Notify anyone @mentioned. Best-effort — never fails the post.
  await notifyForPost(author, post.id, text);

  return NextResponse.json({ post }, { status: 201 });
}
