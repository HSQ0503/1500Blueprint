import { NextResponse } from "next/server";
import { getMembership } from "@/lib/auth/stripe";
import { createLoginToken } from "@/lib/auth/tokens";
import { sendMagicLink } from "@/lib/auth/email";

const GENERIC_MESSAGE =
  "If that email has an active membership, a login link is on its way.";

export async function POST(request: Request) {
  let email = "";
  try {
    const body = await request.json();
    // Canonicalize once: the same value is used for the membership check, the
    // token row, the email recipient, and the session subject.
    email = String(body?.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }
  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, message: "Enter a valid email." }, { status: 400 });
  }

  try {
    const membership = await getMembership(email);
    if (membership.active) {
      const raw = await createLoginToken(email, membership.plan);
      const base = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
      const url = `${base}/api/auth/callback?token=${encodeURIComponent(raw)}`;
      await sendMagicLink(email, url);
    }
  } catch (error) {
    // Don't leak which step failed; the student still sees the generic message.
    console.error("auth/request failed:", error);
  }

  // Always generic so we never reveal who is or isn't a member (anti-enumeration).
  return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
}
