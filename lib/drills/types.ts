// Data model for the drills suite (Phase 2). See the vault notes
// "1500 — Drill Suite (Reference Teardown)" and "1500 — AI Drilling Agent".
// The UI is built against these shapes with mock data; the logic phase fills
// the same shapes, so wiring the backend later does not touch the components.

import type { MultipleChoiceQuestion } from "@/lib/sat/types";

export type DrillSlug =
  | "grammar"
  | "targeted-math"
  | "reading"
  | "word-scan"
  | "vocab"
  | "flashcards"
  | "ai-math";

export type AiRole =
  | "none"
  | "grade-process" // grade an explained solving process (Grammar)
  | "grade-summary" // grade a from-memory recall summary (Reading)
  | "generate"; // generate question / passage content (Reading, AI Math)

// Per-drill brand accent. Maps to the brand color tokens in globals.css.
export type Accent = "brand" | "navy" | "gold" | "sky";

// Free-text grading result shared by the AI drills (Grammar "Explain Your
// Process" and Reading "Your Summary"). Scott owns the prompt that produces it.
export type ProcessFeedback = {
  score: number; // 0..100
  verdict: string; // one-line summary shown under the score
  feedback: string; // AI Feedback prose
  stepsMissed: string[]; // "Steps You Missed" checklist (empty on a perfect run)
};

// Per-pattern mastery, the Grammar Drill progression model.
export type MasteryState = {
  mastered: number; // patterns mastered so far
  total: number; // total patterns in the set
  streak: number; // current perfect-score streak toward the target
  streakTarget: number; // perfect scores in a row to master a pattern (2)
  cycle: number;
};

// Grammar questions are SAT Standard-English-conventions MC items, tagged with
// the grammar pattern they teach.
export type GrammarQuestion = MultipleChoiceQuestion & { pattern: string };
