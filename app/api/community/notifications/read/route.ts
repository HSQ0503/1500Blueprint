import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { markNotificationsRead } from "@/lib/community/notifications";

// Mark notifications read for the signed-in member. Body: { ids?: string[] } —
// omit ids to clear everything (what opening the bell does).
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { ids?: string[] };
  const ids = Array.isArray(body.ids) ? body.ids.filter((i) => typeof i === "string") : undefined;
  await markNotificationsRead(session.email, ids);
  return NextResponse.json({ ok: true });
}
