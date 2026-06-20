import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/config";

export async function POST(request: Request) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const response = NextResponse.redirect(new URL("/login", base), { status: 303 });
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
