import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { recordVocabAnswer } from "@/lib/drills/vocab.server";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as
    | { questionId?: unknown; selectedWord?: unknown }
    | null;
  if (typeof body?.questionId !== "string" || typeof body.selectedWord !== "string") {
    return NextResponse.json({ error: "questionId and selectedWord are required." }, { status: 400 });
  }

  try {
    return NextResponse.json(
      await recordVocabAnswer(session.email, {
        questionId: body.questionId,
        selectedWord: body.selectedWord,
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not record answer.";
    const invalid = /not found|not an answer choice|no correct word/i.test(message);
    if (!invalid) console.error("Vocab answer failed", error);
    return NextResponse.json(
      { error: invalid ? message : "Could not record the vocab answer." },
      { status: invalid ? 400 : 500 },
    );
  }
}
