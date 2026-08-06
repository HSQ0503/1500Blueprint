// Kill switch: practice tests are hidden from students while under
// construction. Flip to false to re-open. Admins (ADMIN_EMAILS) keep access.
// Pure + edge-safe so proxy.ts and server pages can both import it.
export const PRACTICE_TESTS_LOCKED = true;

// Student-facing drill kill switch. Grammar remains available while the other
// drill experiences are being rebuilt; admins retain access for QA.
export const NON_GRAMMAR_DRILLS_LOCKED = true;

const NON_GRAMMAR_DRILL_SLUGS = [
  "targeted-math",
  "reading",
  "word-scan",
  "vocab",
  "flashcards",
  "ai-math",
] as const;

export function isDrillUnderConstruction(slug: string): boolean {
  return (
    NON_GRAMMAR_DRILLS_LOCKED &&
    (NON_GRAMMAR_DRILL_SLUGS as readonly string[]).includes(slug)
  );
}
