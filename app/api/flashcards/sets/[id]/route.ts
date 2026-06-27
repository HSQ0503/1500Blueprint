import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";
import { canEditSet, deleteSet, updateSet } from "@/lib/flashcards/queries";
import type { CardInput, SetVisibility } from "@/lib/flashcards/types";

// Update / delete a single set. Editable by its owner or any admin. Next 16:
// ctx.params is a Promise.
type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  if (!(await canEditSet(id, session.email)))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = (await req.json()) as {
    title?: string;
    description?: string | null;
    cards?: CardInput[];
    visibility?: SetVisibility;
  };

  const visibility: SetVisibility =
    body.visibility === "shared" && isAdminEmail(session.email) ? "shared" : "private";

  await updateSet(id, {
    title: body.title ?? "",
    description: body.description ?? null,
    visibility,
    cards: Array.isArray(body.cards) ? body.cards : [],
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  if (!(await canEditSet(id, session.email)))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await deleteSet(id);
  return NextResponse.json({ ok: true });
}
