export const GRAMMAR_MASTERY_TOTAL = 25;
export const GRAMMAR_MASTERY_MIN_SCORE = 75;
export const GRAMMAR_MASTERY_STREAK_TARGET = 2;

export type GrammarMasteryState = {
  mastered: number;
  total: number;
  streak: number;
  streakTarget: number;
};

export function calculateGrammarMastery(
  scores: Array<number | null>,
): GrammarMasteryState {
  let mastered = 0;
  let streak = 0;

  for (const score of scores) {
    if ((score ?? 0) < GRAMMAR_MASTERY_MIN_SCORE) {
      streak = 0;
      continue;
    }

    streak += 1;
    if (streak >= GRAMMAR_MASTERY_STREAK_TARGET) {
      mastered = Math.min(GRAMMAR_MASTERY_TOTAL, mastered + 1);
      streak = 0;
    }
  }

  return {
    mastered,
    total: GRAMMAR_MASTERY_TOTAL,
    streak,
    streakTarget: GRAMMAR_MASTERY_STREAK_TARGET,
  };
}
