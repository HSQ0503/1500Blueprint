import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateReadingProgress,
  READING_PASS_SCORE,
  READING_STREAK_TARGET,
} from "./readingProgress";

test("a score below 85 resets the reading streak", () => {
  const progress = calculateReadingProgress([READING_PASS_SCORE, READING_PASS_SCORE - 1]);

  assert.deepEqual(progress, { level: 1, streak: 0, streakTarget: READING_STREAK_TARGET });
});

test("a score of 85 increments the reading streak", () => {
  const progress = calculateReadingProgress([READING_PASS_SCORE]);

  assert.deepEqual(progress, { level: 1, streak: 1, streakTarget: READING_STREAK_TARGET });
});

test("three consecutive passing scores advance one level and reset the streak", () => {
  const progress = calculateReadingProgress([85, 92, 100]);

  assert.deepEqual(progress, { level: 2, streak: 0, streakTarget: READING_STREAK_TARGET });
});

test("a failing score breaks a run of passing scores", () => {
  const progress = calculateReadingProgress([85, 90, 84, 88]);

  assert.deepEqual(progress, { level: 1, streak: 1, streakTarget: READING_STREAK_TARGET });
});

test("multiple groups of three passing scores advance multiple levels", () => {
  const progress = calculateReadingProgress([85, 86, 87, 88, 89, 90]);

  assert.deepEqual(progress, { level: 3, streak: 0, streakTarget: READING_STREAK_TARGET });
});
