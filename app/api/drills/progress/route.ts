// Records a question attempt for the objective drills (Targeted Math, Vocab),
// which grade on the client and otherwise send nothing to the server. The AI
// drills (Grammar, Reading) record progress inside /api/drills/grade instead.
// This drives the "don't re-feed mastered questions" pool and the History tab.

import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getQuestion } from "@/lib/drills/admin-queries";
import { recordProgress } from "@/lib/drills/progress";
import type { DrillSlug } from "@/lib/drills/types";

const OBJECTIVE: ReadonlySet<string> = new Set(["targeted-math", "vocab"]);

type Body = { drillSlug?: string; questionId?: string; correct?: boolean };

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { drillSlug, questionId, correct } = body;
  if (!drillSlug || !questionId || typeof correct !== "boolean" || !OBJECTIVE.has(drillSlug)) {
    return NextResponse.json(
      { error: "drillSlug (objective), questionId, and correct are required" },
      { status: 400 },
    );
  }

  // Confirm the question exists, belongs to this drill, and is published — same
  // guard as the grade route, so a client can't record progress on a draft/foreign id.
  const question = await getQuestion(questionId);
  if (!question || question.drillSlug !== drillSlug || question.status !== "published") {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  try {
    await recordProgress(session.email, { drillSlug: drillSlug as DrillSlug, questionId, correct });
  } catch (e) {
    console.error("recordProgress failed:", e);
    return NextResponse.json({ error: "Could not record progress" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
