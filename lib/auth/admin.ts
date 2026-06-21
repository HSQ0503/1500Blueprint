// Admin allowlist for the drill CMS. Comma-separated emails in ADMIN_EMAILS,
// lowercased. Pure + edge-safe (no Node-only / next/headers imports) so it can
// be used from proxy.ts (edge) AND from server route handlers/pages. The
// server-side authorization boundary lives in ./requireAdmin (uses getSession).
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
