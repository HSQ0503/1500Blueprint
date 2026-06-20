import type { Accent, DrillSlug } from "./types";

// Icon keys resolved to SVG components in components/drills/shared/icons.tsx.
export type DrillIconName =
  | "grammar"
  | "target"
  | "reading"
  | "scan"
  | "vocab"
  | "flashcards"
  | "aimath";

export type CardStat = { label: string; value: string };
export type CardCta = { label: string; href: string };

// One entry per card on the drills hub. The reference product shows 8 cards:
// Targeted Math appears twice (Medium + Hard) and Word Scan is one card with two
// mode buttons, so the hub list is not 1:1 with the 7 drill slugs.
export type DrillCard = {
  key: string;
  slug: DrillSlug;
  title: string;
  category: string; // academic grouping on the hub (Writing / Reading / Math / Vocabulary)
  badge?: string; // difficulty / variant chip (e.g. "Medium", "Hard")
  tagline: string;
  icon: DrillIconName;
  accent: Accent; // thin top rule color, the only per-card color
  usesAI: boolean;
  beta?: boolean;
  stats: CardStat[];
  ctas: CardCta[]; // 1 primary button, or 2 for Word Scan's two modes
  secondary?: CardCta; // optional ghost button (History / Manage / View Progress)
};

// Display order for the hub's category sections.
export const CATEGORY_ORDER = ["Writing", "Reading", "Math", "Vocabulary"];

export const DRILL_CARDS: DrillCard[] = [
  {
    key: "grammar",
    slug: "grammar",
    title: "Grammar Drill",
    category: "Writing",
    tagline: "Master grammar patterns by writing detailed explanations.",
    icon: "grammar",
    accent: "brand",
    usesAI: true,
    stats: [
      { label: "mastered", value: "0/25" },
      { label: "attempts", value: "4" },
    ],
    ctas: [{ label: "Start Drill", href: "/drills/grammar" }],
    secondary: { label: "History", href: "/drills/grammar" },
  },
  {
    key: "reading",
    slug: "reading",
    title: "Reading Comprehension",
    category: "Reading",
    tagline: "Comprehend hard SAT passages under time pressure.",
    icon: "reading",
    accent: "sky",
    usesAI: true,
    stats: [
      { label: "level", value: "1" },
      { label: "current streak", value: "0" },
      { label: "attempts", value: "2" },
    ],
    ctas: [{ label: "Start Drill", href: "/drills/reading" }],
    secondary: { label: "History", href: "/drills/reading" },
  },
  {
    key: "word-scan",
    slug: "word-scan",
    title: "Word Scan Drill",
    category: "Reading",
    tagline: "Train your eye to spot elimination keywords in answer choices.",
    icon: "scan",
    accent: "gold",
    usesAI: false,
    stats: [
      { label: "Ceased", value: "Not done yet" },
      { label: "Bad Mold", value: "Not done yet" },
    ],
    ctas: [
      { label: "Ceased", href: "/drills/word-scan?mode=ceased" },
      { label: "Bad Mold", href: "/drills/word-scan?mode=bad-mold" },
    ],
  },
  {
    key: "targeted-math-medium",
    slug: "targeted-math",
    title: "Targeted Math Practice",
    category: "Math",
    badge: "Medium",
    tagline: "Get 10 correct before losing all your lives.",
    icon: "target",
    accent: "navy",
    usesAI: false,
    stats: [
      { label: "wins", value: "0" },
      { label: "accuracy", value: "100%" },
      { label: "avg/question", value: "27s" },
    ],
    ctas: [{ label: "Start Challenge", href: "/drills/targeted-math?difficulty=medium" }],
    secondary: { label: "View History", href: "/drills/targeted-math?difficulty=medium" },
  },
  {
    key: "targeted-math-hard",
    slug: "targeted-math",
    title: "Targeted Math Practice",
    category: "Math",
    badge: "Hard",
    tagline: "Get 10 correct before losing all your lives.",
    icon: "target",
    accent: "navy",
    usesAI: false,
    stats: [
      { label: "wins", value: "0" },
      { label: "accuracy", value: "33%" },
      { label: "avg/question", value: "5s" },
    ],
    ctas: [{ label: "Start Challenge", href: "/drills/targeted-math?difficulty=hard" }],
    secondary: { label: "View History", href: "/drills/targeted-math?difficulty=hard" },
  },
  {
    key: "ai-math",
    slug: "ai-math",
    title: "AI Math Practice",
    category: "Math",
    tagline: "High-quality AI-generated SAT math questions.",
    icon: "aimath",
    accent: "brand",
    usesAI: true,
    beta: true,
    stats: [
      { label: "attempted", value: "3" },
      { label: "accuracy", value: "67%" },
      { label: "questions in pool", value: "1388" },
    ],
    ctas: [{ label: "Start Practice", href: "/drills/ai-math" }],
    secondary: { label: "History", href: "/drills/ai-math" },
  },
  {
    key: "vocab",
    slug: "vocab",
    title: "Vocab Drill",
    category: "Vocabulary",
    tagline: "Match definitions to vocabulary terms in a timed session.",
    icon: "vocab",
    accent: "brand",
    usesAI: false,
    stats: [
      { label: "total words", value: "1000" },
      { label: "mastered", value: "0" },
      { label: "best streak", value: "0" },
    ],
    ctas: [{ label: "Start Drill", href: "/drills/vocab" }],
    secondary: { label: "View Progress", href: "/drills/vocab" },
  },
  {
    key: "flashcards",
    slug: "flashcards",
    title: "Vocab Flashcards",
    category: "Vocabulary",
    tagline: "Review the words you save from the Vocab Drill.",
    icon: "flashcards",
    accent: "sky",
    usesAI: false,
    stats: [
      { label: "cards in deck", value: "0" },
      { label: "due for review", value: "0" },
    ],
    ctas: [{ label: "Instructions", href: "/drills/flashcards" }],
    secondary: { label: "Manage", href: "/drills/flashcards" },
  },
];

const TITLES: Record<DrillSlug, string> = {
  grammar: "Grammar Drill",
  "targeted-math": "Targeted Math Practice",
  reading: "Reading Comprehension",
  "word-scan": "Word Scan Drill",
  vocab: "Vocab Drill",
  flashcards: "Vocab Flashcards",
  "ai-math": "AI Math Practice",
};

export function drillTitle(slug: string): string {
  return TITLES[slug as DrillSlug] ?? "Drill";
}
