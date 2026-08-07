import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { updateVocabAutoAdd } from "@/lib/drills/vocab.server";

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { autoAddFlashcards?: unknown } | null;
  if (typeof body?.autoAddFlashcards !== "boolean") {
    return NextResponse.json({ error: "autoAddFlashcards must be a boolean." }, { status: 400 });
  }
  try {
    await updateVocabAutoAdd(session.email, body.autoAddFlashcards);
    return NextResponse.json({ ok: true, autoAddFlashcards: body.autoAddFlashcards });
  } catch (error) {
    console.error("Vocab setting update failed", error);
    return NextResponse.json({ error: "Could not save the vocab setting." }, { status: 500 });
  }
}
