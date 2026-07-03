import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canModerateComment, deleteComment } from "@/lib/community/queries";

// Delete a comment. Allowed for its author or any admin. Next 16: ctx.params is
// a Promise.
type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  if (!(await canModerateComment(id, session.email)))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await deleteComment(id);
  return NextResponse.json({ ok: true });
}
