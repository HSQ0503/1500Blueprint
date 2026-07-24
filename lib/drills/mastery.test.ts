import assert from "node:assert/strict";
import test from "node:test";
import {
  GRAMMAR_MASTERY_TOTAL,
  calculateGrammarMastery,
} from "./mastery";

test("starts with no grammar mastery", () => {
  assert.deepEqual(calculateGrammarMastery([]), {
    mastered: 0,
    total: 25,
    streak: 0,
    streakTarget: 2,
  });
});

test("masters one pattern after two passing scores", () => {
  assert.deepEqual(calculateGrammarMastery([75, 90]), {
    mastered: 1,
    total: 25,
    streak: 0,
    streakTarget: 2,
  });
});

test("a failing score resets the mastery streak", () => {
  assert.deepEqual(calculateGrammarMastery([80, 70, 95]), {
    mastered: 0,
    total: 25,
    streak: 1,
    streakTarget: 2,
  });
});

test("rebuilds cumulative mastery from historical attempts", () => {
  assert.deepEqual(calculateGrammarMastery([75, 75, 20, 80, 99, 100]), {
    mastered: 2,
    total: 25,
    streak: 1,
    streakTarget: 2,
  });
});

test("restores the reported 9 of 25 after reopening", () => {
  assert.deepEqual(calculateGrammarMastery(Array(18).fill(80)), {
    mastered: 9,
    total: 25,
    streak: 0,
    streakTarget: 2,
  });
});

test("never exceeds the configured total", () => {
  assert.equal(
    calculateGrammarMastery(Array(GRAMMAR_MASTERY_TOTAL * 2 + 4).fill(100))
      .mastered,
    GRAMMAR_MASTERY_TOTAL,
  );
});
