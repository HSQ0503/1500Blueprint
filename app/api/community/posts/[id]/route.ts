import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canModeratePost, deletePost } from "@/lib/community/queries";

// Delete a post. Allowed for its author or any admin (Scott's moderation).
// Next 16: ctx.params is a Promise.
type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  if (!(await canModeratePost(id, session.email)))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await deletePost(id);
  return NextResponse.json({ ok: true });
}
