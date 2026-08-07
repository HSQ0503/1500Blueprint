import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { VOCAB_SESSION_SIZE } from "@/lib/drills/vocabProgress";
import { completeVocabSession } from "@/lib/drills/vocab.server";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as
    | { correct?: unknown; total?: unknown; durationSeconds?: unknown; clientToken?: unknown }
    | null;
  if (
    !Number.isInteger(body?.correct) ||
    body?.total !== VOCAB_SESSION_SIZE ||
    !Number.isInteger(body?.durationSeconds) ||
    typeof body?.clientToken !== "string" ||
    (body.correct as number) < 0 ||
    (body.correct as number) > VOCAB_SESSION_SIZE ||
    (body.durationSeconds as number) < 0
  ) {
    return NextResponse.json({ error: "Invalid seven-question vocab session." }, { status: 400 });
  }
  try {
    const award = await completeVocabSession(session.email, {
      correct: body.correct as number,
      total: VOCAB_SESSION_SIZE,
      durationSeconds: body.durationSeconds as number,
      clientToken: body.clientToken,
    });
    return NextResponse.json({ ok: true, ...award });
  } catch (error) {
    console.error("Vocab session completion failed", error);
    return NextResponse.json({ error: "Could not save the vocab session." }, { status: 500 });
  }
}
