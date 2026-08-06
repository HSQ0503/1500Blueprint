import assert from "node:assert/strict";
import test from "node:test";
import { isDrillUnderConstruction, NON_GRAMMAR_DRILLS_LOCKED } from "./flags";

test("keeps Grammar available while locking every other known drill", () => {
  assert.equal(NON_GRAMMAR_DRILLS_LOCKED, true);
  assert.equal(isDrillUnderConstruction("grammar"), false);

  for (const slug of ["targeted-math", "reading", "word-scan", "vocab", "flashcards", "ai-math"]) {
    assert.equal(isDrillUnderConstruction(slug), true, slug);
  }
});

test("does not turn unknown routes into construction redirects", () => {
  assert.equal(isDrillUnderConstruction("not-a-drill"), false);
});
