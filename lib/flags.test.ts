import assert from "node:assert/strict";
import test from "node:test";
import {
  isDrillUnderConstruction,
  isPracticeTestUnderConstruction,
  NON_GRAMMAR_DRILLS_LOCKED,
} from "./flags";

test("keeps Grammar and Reading available while locking unfinished drills", () => {
  assert.equal(NON_GRAMMAR_DRILLS_LOCKED, true);
  assert.equal(isDrillUnderConstruction("grammar"), false);
  assert.equal(isDrillUnderConstruction("reading"), false);

  for (const slug of ["targeted-math", "word-scan", "vocab", "flashcards", "ai-math"]) {
    assert.equal(isDrillUnderConstruction(slug), true, slug);
  }
});

test("does not turn unknown routes into construction redirects", () => {
  assert.equal(isDrillUnderConstruction("not-a-drill"), false);
});

test("makes Practice Tests 6 and 7 public while keeping Tests 1-5 locked", () => {
  for (let number = 1; number <= 5; number++) {
    assert.equal(isPracticeTestUnderConstruction(`practice-test-${number}`), true);
  }
  assert.equal(isPracticeTestUnderConstruction("practice-test-6"), false);
  assert.equal(isPracticeTestUnderConstruction("practice-test-7"), false);
  assert.equal(isPracticeTestUnderConstruction("completed"), false);
});
