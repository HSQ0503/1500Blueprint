// Practice Tests 1-5 remain student-locked while Test 6 is public. Admins keep
// access to every test for QA. Pure + edge-safe for proxy and server routes.
export const LOCKED_PRACTICE_TEST_SLUGS = [
  "practice-test-1",
  "practice-test-2",
  "practice-test-3",
  "practice-test-4",
  "practice-test-5",
] as const;

export function isPracticeTestUnderConstruction(slug: string): boolean {
  return (LOCKED_PRACTICE_TEST_SLUGS as readonly string[]).includes(slug);
}

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
