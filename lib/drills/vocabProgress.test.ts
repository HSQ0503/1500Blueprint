import assert from "node:assert/strict";
import test from "node:test";
import {
  VOCAB_MASTERY_TARGET,
  VOCAB_SESSION_SIZE,
  advanceVocabProgress,
  nextVocabFlashcardPosition,
  selectVocabSession,
  summarizeVocabAttempts,
} from "./vocabProgress";

test("a vocab session contains seven questions and rotates through the pool", () => {
  const words = Array.from({ length: 10 }, (_, index) => ({ id: `word-${index}` }));

  assert.equal(VOCAB_SESSION_SIZE, 7);
  assert.deepEqual(
    selectVocabSession(words, 0).map((word) => word.id),
    ["word-0", "word-1", "word-2", "word-3", "word-4", "word-5", "word-6"],
  );
  assert.deepEqual(
    selectVocabSession(words, 7).map((word) => word.id),
    ["word-7", "word-8", "word-9", "word-0", "word-1", "word-2", "word-3"],
  );
});

test("bookmarked flashcards are positioned ahead of imported and auto-added cards", () => {
  const positions = [-2, -1, 1, 2, 3];

  assert.equal(nextVocabFlashcardPosition(positions, true), -3);
  assert.equal(nextVocabFlashcardPosition(positions, false), 4);
  assert.equal(nextVocabFlashcardPosition([], true), -1);
  assert.equal(nextVocabFlashcardPosition([], false), 1);
});

test("three correct answers in a row master a word while preserving the global streak", () => {
  let state = { wordCorrectStreak: 0, currentStreak: 4, bestStreak: 6, mastered: false };

  state = advanceVocabProgress(state, true);
  assert.deepEqual(state, {
    wordCorrectStreak: 1,
    currentStreak: 5,
    bestStreak: 6,
    mastered: false,
  });

  state = advanceVocabProgress(state, true);
  state = advanceVocabProgress(state, true);

  assert.equal(VOCAB_MASTERY_TARGET, 3);
  assert.deepEqual(state, {
    wordCorrectStreak: 3,
    currentStreak: 7,
    bestStreak: 7,
    mastered: true,
  });
});

test("an incorrect answer resets both the word and current streak but not the best streak", () => {
  assert.deepEqual(
    advanceVocabProgress(
      { wordCorrectStreak: 2, currentStreak: 5, bestStreak: 8, mastered: false },
      false,
    ),
    { wordCorrectStreak: 0, currentStreak: 0, bestStreak: 8, mastered: false },
  );
});

test("completed attempt statistics provide last 3, last 10, and all-time accuracy and duration", () => {
  const attempts = Array.from({ length: 12 }, (_, index) => ({
    correct: index < 2 ? 0 : 7,
    total: 7,
    durationSeconds: 30 + index,
  }));
  const stats = summarizeVocabAttempts(attempts);

  assert.deepEqual(stats.last3, { accuracy: 100, averageSeconds: 40, sessions: 3 });
  assert.deepEqual(stats.last10, { accuracy: 100, averageSeconds: 37, sessions: 10 });
  assert.deepEqual(stats.all, { accuracy: 83, averageSeconds: 36, sessions: 12 });
});
