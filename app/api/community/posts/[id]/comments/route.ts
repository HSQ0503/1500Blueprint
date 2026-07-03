import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getHubState } from "@/lib/gamification/state";
import { addComment } from "@/lib/community/queries";

// Add a comment to a post. Any signed-in member. Next 16: ctx.params is a Promise.
type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { body?: string; parentId?: string | null };
  const text = (body.body ?? "").trim();
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });
  const parentId = typeof body.parentId === "string" && body.parentId ? body.parentId : null;

  const hub = await getHubState(session.email);
  const author = {
    email: session.email,
    name: hub.player.name,
    initials: hub.player.initials,
    handle: session.email.split("@")[0],
    level: hub.player.level,
  };

  const comment = await addComment(id, author, text, parentId);
  if (!comment) return NextResponse.json({ error: "comment_failed" }, { status: 500 });
  return NextResponse.json({ comment }, { status: 201 });
}
