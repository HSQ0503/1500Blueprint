import { getSession, type Session } from "./session";
import { isAdminEmail } from "./admin";

// Server-side authorization boundary for /admin. Returns the admin session, or
// null if the caller is not a signed-in admin. Call at the top of every admin
// page (server component) and admin route handler BEFORE touching data — the
// proxy gate is defense-in-depth; this is the real check. Imports getSession
// (next/headers), so it is server-only — never import into proxy.ts.
export async function getAdminSession(): Promise<Session | null> {
  const session = await getSession();
  if (!session || !isAdminEmail(session.email)) return null;
  return session;
}
