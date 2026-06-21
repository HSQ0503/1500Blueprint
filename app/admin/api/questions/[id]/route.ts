import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth/requireAdmin";
import {
  deleteQuestion,
  getQuestion,
  replaceWalkthrough,
  updateQuestion,
  type QuestionInput,
  type WalkthroughStepInput,
} from "@/lib/drills/admin-queries";

// Single-question CMS endpoint. Every method authorizes with getAdminSession()
// before touching the service-role queries. Next 16: ctx.params is a Promise.
type Ctx = { params: Promise<{ id: string }> };

const forbidden = () => NextResponse.json({ error: "forbidden" }, { status: 403 });

export async function GET(_req: NextRequest, ctx: Ctx) {
  if (!(await getAdminSession())) return forbidden();
  const { id } = await ctx.params;
  const question = await getQuestion(id);
  if (!question) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(question);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  if (!(await getAdminSession())) return forbidden();
  const { id } = await ctx.params;
  const body = (await req.json()) as {
    question: QuestionInput;
    walkthrough: WalkthroughStepInput[];
  };
  // Trust the route id over the body so the two writes always target one row.
  await updateQuestion({ ...body.question, id });
  await replaceWalkthrough(id, body.walkthrough);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await getAdminSession())) return forbidden();
  const { id } = await ctx.params;
  await deleteQuestion(id);
  return NextResponse.json({ ok: true });
}
