import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth/requireAdmin";
import { updateDrill, type DrillUpdate } from "@/lib/drills/admin-queries";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { slug } = await ctx.params;
  const body = (await req.json()) as DrillUpdate;
  await updateDrill(slug, body);
  return NextResponse.json({ ok: true });
}
