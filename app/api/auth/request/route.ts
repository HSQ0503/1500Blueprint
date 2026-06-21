import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, appBaseUrl, isDevBypass } from "@/lib/auth/config";
import { isAdminEmail } from "@/lib/auth/admin";
import { getMembership } from "@/lib/auth/stripe";
import { createLoginToken } from "@/lib/auth/tokens";
import { sendMagicLink } from "@/lib/auth/email";
import { signSession, sessionCookieOptions } from "@/lib/auth/session";
import { recordLogin } from "@/lib/auth/users";

const GENERIC_MESSAGE =
  "If that email has an active membership, a login link is on its way.";

// Constant-time check of the admin access key. Disabled (always false) unless
// ADMIN_ACCESS_KEY is set, so a missing/empty env can never authorize a login.
function isAdminKey(provided: string | undefined): boolean {
  const expected = process.env.ADMIN_ACCESS_KEY;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  let email = "";
  let key: string | undefined;
  try {
    const body = await request.json();
    // Canonicalize once: the same value is used for the membership check, the
    // token row, the email recipient, and the session subject.
    email = String(body?.email ?? "").trim().toLowerCase();
    key = typeof body?.key === "string" ? body.key : undefined;
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
    const response = NextResponse.json({ ok: true, redirect: "/drills" });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  }

  // Admin fast-path (works in production): an allowlisted admin email plus the
  // secret ADMIN_ACCESS_KEY signs in immediately, skipping the email round-trip.
  // Both are required — the public admin email alone is never enough. A wrong or
  // missing key falls through to the normal magic-link flow below.
  if (isAdminEmail(email) && isAdminKey(key)) {
    await recordLogin(email, "admin");
    const token = await signSession({ email, plan: "admin" });
    const response = NextResponse.json({ ok: true, redirect: "/drills" });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  }

  try {
    const membership = await getMembership(email);
    if (membership.active) {
      const raw = await createLoginToken(email, membership.plan);
      const base = appBaseUrl(new URL(request.url).origin);
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
