// Gamification UI contracts (the shapes the hub + nav render). The live values
// come from lib/gamification/state.ts (DB-backed). drillStats + patternOfTheDay
// are still placeholder content for the drill-catalog cards.

export type Player = {
  name: string;
  firstName: string;
  initials: string;
  level: number;
  xp: number;
  xpForNextLevel: number;
  streak: number;
  plan: string; // membership tier label, e.g. "1500 Club"
  rank: number; // weekly leaderboard rank
  season: string;
  rivalName: string; // person just ahead on the board
  xpBehindRival: number;
};

// Compact stats for the top nav (shown on every authed surface).
export type NavStats = {
  streak: number;
  level: number;
  xp: number;
  name: string;
  initials: string;
  plan: string;
};

// One day in the weekly streak row. `done` = the daily goal was met that day
// (what keeps the flame); `xp` = XP earned that day (for display).
export type StreakDay = { label: string; xp: number; done: boolean };

export type LeaderRow = {
  rank: number;
  name: string;
  xp: string;
  initials: string;
  you: boolean;
};

export type Badge = { glyph: string; locked: boolean; label: string };

// Placeholder pattern-of-the-day + per-drill catalog stats (DrillCatalog cards).
export const patternOfTheDay = {
  title: "Verb tense & sequence",
  note: "Nail this one twice in a row for a 2× XP bonus and a fresh badge.",
};

export const drillStats = {
  grammar: { xpReward: 50, mastered: 9, totalPatterns: 25, streak: 5, barPct: 36 },
  reading: { xpReward: 40, level: 1, attempts: 2, barPct: 20 },
  mathMedium: { accuracy: "100%", avg: "27s" },
  mathHard: { accuracy: "33%", avg: "5s" },
  aiMath: { accuracy: "67%", pool: "1,388" },
  vocab: { words: "1000", mastered: "0", bestStreak: "0", xpReward: 30 },
  flashcards: { inDeck: "0", due: "0" },
} as const;
