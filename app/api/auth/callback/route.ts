import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/config";
import { consumeLoginToken } from "@/lib/auth/tokens";
import { signSession, sessionCookieOptions } from "@/lib/auth/session";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const base = process.env.NEXT_PUBLIC_APP_URL ?? requestUrl.origin;
  const raw = requestUrl.searchParams.get("token");

  if (!raw) return NextResponse.redirect(new URL("/login?error=invalid", base));

  const result = await consumeLoginToken(raw);
  if (!result) return NextResponse.redirect(new URL("/login?error=expired", base));

  const token = await signSession({ email: result.email, plan: result.plan });
  const response = NextResponse.redirect(new URL("/practice-test", base));
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
