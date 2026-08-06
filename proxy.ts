import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify, type JWTPayload } from "jose";
import { SESSION_COOKIE } from "@/lib/auth/config";
import { isAdminEmail } from "@/lib/auth/admin";
import { isDrillUnderConstruction, PRACTICE_TESTS_LOCKED } from "@/lib/flags";

// Paths reachable without a session.
const PUBLIC_PATHS = ["/login"];
// The admin CMS is gated to allowlisted admin emails (ADMIN_EMAILS).
const ADMIN_PREFIX = "/admin";

function isPublic(pathname: string): boolean {
  if (pathname.startsWith("/api/auth")) return true;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAdminPath(pathname: string): boolean {
  return pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
}

// Verify the session JWT and return its payload, or null if absent/invalid.
async function sessionPayload(request: NextRequest): Promise<JWTPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}

// Next 16: this file replaces the old `middleware.ts` (Middleware → Proxy).
// Gates the whole drill site behind a session; only /login and the auth
// endpoints are reachable logged out. The /admin area additionally requires an
// admin email (defense-in-depth; pages/routes re-check via getAdminSession).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const payload = await sessionPayload(request);
  if (!payload) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  const email = typeof payload.sub === "string" ? payload.sub : null;
  const isAdmin = isAdminEmail(email);

  if (isAdminPath(pathname)) {
    if (!isAdmin) {
      // Signed-in non-admin (a student): bounce to the drills hub.
      const url = request.nextUrl.clone();
      url.pathname = "/drills";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Only Grammar is student-ready. Keep the remaining drill players behind
  // the hub's under-construction state while preserving admin QA access.
  if (!isAdmin && pathname.startsWith("/drills/")) {
    const drillSlug = pathname.split("/")[2] ?? "";
    if (isDrillUnderConstruction(drillSlug)) {
      const url = request.nextUrl.clone();
      url.pathname = "/drills";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Practice tests under construction: students may only reach the index page
  // (which shows the notice). Deeper test pages and the test APIs are blocked.
  if (PRACTICE_TESTS_LOCKED && !isAdmin) {
    if (pathname.startsWith("/practice-test/")) {
      const url = request.nextUrl.clone();
      url.pathname = "/practice-test";
      url.search = "";
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith("/api/practice-test") || pathname.startsWith("/api/tests")) {
      return NextResponse.json({ error: "Practice tests are under construction." }, { status: 503 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all paths except static assets and image files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
