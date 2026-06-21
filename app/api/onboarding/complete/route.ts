import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { markOnboarded } from "@/lib/gamification/state";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  await markOnboarded(session.email);
  return NextResponse.json({ ok: true });
}
