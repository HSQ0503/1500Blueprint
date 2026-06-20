import { NextResponse } from "next/server";
import { SESSION_COOKIE, isDevBypass } from "@/lib/auth/config";
import { getMembership } from "@/lib/auth/stripe";
import { createLoginToken } from "@/lib/auth/tokens";
import { sendMagicLink } from "@/lib/auth/email";
import { signSession, sessionCookieOptions } from "@/lib/auth/session";
import { recordLogin } from "@/lib/auth/users";

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

  // Dev-only bypass: log allowlisted emails straight in, skipping Stripe + Resend
  // + the token table. Inert in production (see isDevBypass).
  if (isDevBypass(email)) {
    await recordLogin(email, "dev");
    const token = await signSession({ email, plan: "dev" });
    const response = NextResponse.json({ ok: true, redirect: "/practice-test" });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
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
