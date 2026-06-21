// Shared auth constants.

export const SESSION_COOKIE = "drill_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, in seconds
export const TOKEN_TTL_SECONDS = 60 * 15; // magic link is valid for 15 minutes

// Stripe subscription statuses that count as an active membership.
export const ACTIVE_STATUSES = ["active", "trialing"] as const;

// Absolute base URL for building login links + redirects. Prefers
// NEXT_PUBLIC_APP_URL (canonical/custom domain) but tolerates a scheme-less value
// like "1500-blueprint.vercel.app" by defaulting it to https — otherwise
// `new URL("/path", base)` throws ERR_INVALID_URL. Falls back to the request
// origin when the env var is unset. Trailing slashes are trimmed so callers can
// safely append paths.
export function appBaseUrl(fallbackOrigin: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const raw = configured || fallbackOrigin;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withScheme.replace(/\/+$/, "");
}

// Dev-only login bypass. Active ONLY when NODE_ENV !== "production" AND the email
// is allowlisted in DEV_BYPASS_EMAILS. Lets us into the gated site without
// Stripe/Resend while the real membership source is being wired up. Because
// Vercel sets NODE_ENV=production, this is inert in prod even if the env var leaks.
const DEV_BYPASS_EMAILS = (process.env.DEV_BYPASS_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isDevBypass(email: string): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    DEV_BYPASS_EMAILS.includes(email.trim().toLowerCase())
  );
}
