export const READING_PASS_SCORE = 85;
export const READING_STREAK_TARGET = 3;

export type ReadingProgressState = {
  level: number;
  streak: number;
  streakTarget: number;
};

export function calculateReadingProgress(scores: Array<number | null>): ReadingProgressState {
  let level = 1;
  let streak = 0;

  for (const score of scores) {
    if ((score ?? 0) < READING_PASS_SCORE) {
      streak = 0;
      continue;
    }

    streak += 1;
    if (streak === READING_STREAK_TARGET) {
      level += 1;
      streak = 0;
    }
  }

  return { level, streak, streakTarget: READING_STREAK_TARGET };
}
