import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listNotifications } from "@/lib/community/notifications";

// The signed-in member's recent notifications + unread count (homepage bell).
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const data = await listNotifications(session.email);
  return NextResponse.json(data);
}
