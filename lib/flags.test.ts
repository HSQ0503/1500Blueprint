import assert from "node:assert/strict";
import test from "node:test";
import {
  isDrillUnderConstruction,
  isPracticeTestUnderConstruction,
  NON_GRAMMAR_DRILLS_LOCKED,
} from "./flags";

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

test("makes Practice Test 6 public while keeping Tests 1-5 locked", () => {
  for (let number = 1; number <= 5; number++) {
    assert.equal(isPracticeTestUnderConstruction(`practice-test-${number}`), true);
  }
  assert.equal(isPracticeTestUnderConstruction("practice-test-6"), false);
  assert.equal(isPracticeTestUnderConstruction("completed"), false);
});
