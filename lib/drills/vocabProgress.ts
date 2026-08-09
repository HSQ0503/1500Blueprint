export const VOCAB_SESSION_SIZE = 7;
export const VOCAB_MASTERY_TARGET = 3;

export function nextVocabFlashcardPosition(
  positions: readonly number[],
  prioritized: boolean,
): number {
  if (prioritized) return Math.min(0, ...positions) - 1;
  return Math.max(0, ...positions) + 1;
}

export type VocabProgressState = {
  wordCorrectStreak: number;
  currentStreak: number;
  bestStreak: number;
  mastered: boolean;
};

export function advanceVocabProgress(
  state: VocabProgressState,
  correct: boolean,
): VocabProgressState {
  if (!correct) {
    return {
      wordCorrectStreak: 0,
      currentStreak: 0,
      bestStreak: state.bestStreak,
      mastered: state.mastered,
    };
  }

  const wordCorrectStreak = Math.min(
    VOCAB_MASTERY_TARGET,
    state.wordCorrectStreak + 1,
  );
  const currentStreak = state.currentStreak + 1;
  return {
    wordCorrectStreak,
    currentStreak,
    bestStreak: Math.max(state.bestStreak, currentStreak),
    mastered: state.mastered || wordCorrectStreak >= VOCAB_MASTERY_TARGET,
  };
}

export function selectVocabSession<T>(items: readonly T[], startIndex = 0): T[] {
  if (items.length === 0) return [];
  const total = Math.min(VOCAB_SESSION_SIZE, items.length);
  const normalizedStart = ((startIndex % items.length) + items.length) % items.length;
  return Array.from({ length: total }, (_, offset) => items[(normalizedStart + offset) % items.length]);
}

export type VocabAttempt = {
  correct: number;
  total: number;
  durationSeconds: number;
};

export type VocabAttemptWindow = {
  accuracy: number | null;
  averageSeconds: number | null;
  sessions: number;
};

export type VocabAttemptStats = {
  last3: VocabAttemptWindow;
  last10: VocabAttemptWindow;
  all: VocabAttemptWindow;
};

export type VocabWordProgress = {
  questionId: string;
  word: string;
  correctStreak: number;
  mastered: boolean;
};

export type VocabDashboardState = {
  totalWords: number;
  masteredCount: number;
  currentStreak: number;
  bestStreak: number;
  autoAddFlashcards: boolean;
  savedQuestionIds: string[];
  bookmarkedQuestionIds: string[];
  flashcardCount: number;
  words: VocabWordProgress[];
  attempts: VocabAttemptStats;
};

export type VocabAnswerResult = {
  correct: boolean;
  correctWord: string;
  wordCorrectStreak: number;
  mastered: boolean;
  masteredCount: number;
  currentStreak: number;
  bestStreak: number;
  autoAdded: boolean;
  flashcardSaveFailed?: boolean;
};

function summarizeWindow(attempts: readonly VocabAttempt[]): VocabAttemptWindow {
  if (attempts.length === 0) {
    return { accuracy: null, averageSeconds: null, sessions: 0 };
  }
  const correct = attempts.reduce((sum, attempt) => sum + attempt.correct, 0);
  const total = attempts.reduce((sum, attempt) => sum + attempt.total, 0);
  const seconds = attempts.reduce((sum, attempt) => sum + attempt.durationSeconds, 0);
  return {
    accuracy: total > 0 ? Math.round((correct / total) * 100) : null,
    averageSeconds: Math.round(seconds / attempts.length),
    sessions: attempts.length,
  };
}

export function summarizeVocabAttempts(
  attempts: readonly VocabAttempt[],
): VocabAttemptStats {
  return {
    last3: summarizeWindow(attempts.slice(-3)),
    last10: summarizeWindow(attempts.slice(-10)),
    all: summarizeWindow(attempts),
  };
}
