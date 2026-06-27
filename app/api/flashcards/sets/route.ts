import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";
import { createSet } from "@/lib/flashcards/queries";
import type { CardInput, SetVisibility } from "@/lib/flashcards/types";

// Create a flashcard set. Any signed-in member can create one for themselves;
// only an admin may publish it to all students (visibility = 'shared').
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    title?: string;
    description?: string | null;
    cards?: CardInput[];
    visibility?: SetVisibility;
  };

  const visibility: SetVisibility =
    body.visibility === "shared" && isAdminEmail(session.email) ? "shared" : "private";

  const id = await createSet(session.email, {
    title: body.title ?? "",
    description: body.description ?? null,
    visibility,
    cards: Array.isArray(body.cards) ? body.cards : [],
  });

  if (!id) return NextResponse.json({ error: "create_failed" }, { status: 500 });
  return NextResponse.json({ id }, { status: 201 });
}
