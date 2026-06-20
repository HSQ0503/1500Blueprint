// Local mock data for the Word Scan drill (UI-first, no backend/AI).
//
// Mechanics: a fast visual-scanning elimination drill. Each question shows four
// long answer-choice paragraphs; the student flags every choice whose FIRST word
// is one of the mode's target verbs. Grading is deterministic exact-match of the
// flagged set against the choices that actually start with a target verb. The run
// is STRICT single-failure: one wrong question ends it.

export type WordScanMode = "ceased" | "bad-mold";

export type WordScanChoice = {
  id: "A" | "B" | "C" | "D";
  text: string;
};

export type WordScanQuestion = {
  choices: WordScanChoice[];
  // Ids whose first word is a target verb — the exact set the student must flag.
  correct: WordScanChoice["id"][];
};

export type WordScanModeConfig = {
  name: string;
  // Target verbs shown in the instruction line, in display order.
  verbs: string[];
  questions: WordScanQuestion[];
};

// Per-question time budget (seconds) for the RingTimer countdown. The reference
// is a brutal ~2s; we give a slightly more playable window while keeping it fast.
export const QUESTION_SECONDS = 5;

export const TOTAL_QUESTIONS = 10;

// The lowercased first word of a choice, used for deterministic grading.
export function firstWord(text: string): string {
  const match = text.trim().match(/^[A-Za-z]+/);
  return match ? match[0].toLowerCase() : "";
}

const waterDiplomacyChoices: WordScanChoice[] = [
  {
    id: "A",
    text: "It illustrates the complexity of water diplomacy through a detailed examination of the Mekong River basin conflicts, traces the evolution of multilateral negotiations among affected nations, and then highlights recent breakthrough agreements.",
  },
  {
    id: "B",
    text: "It introduces the concept of hydropolitics in international relations, presents case studies of successful water-sharing agreements between riparian states, and then identifies common elements that contributed to their diplomatic success.",
  },
  {
    id: "C",
    text: "It describes the growing tension over shared water resources between neighboring countries, examines several diplomatic frameworks that have emerged to address these conflicts, and then evaluates their effectiveness in preventing water wars.",
  },
  {
    id: "D",
    text: "It asserts that traditional sovereignty models are inadequate for managing transboundary water disputes, analyzes how climate change intensifies competition for scarce water resources, and then proposes a new cooperative governance framework.",
  },
];

const urbanGreeneryChoices: WordScanChoice[] = [
  {
    id: "A",
    text: "Compares the cooling effect of dense tree canopies in two adjacent districts, measures the difference in recorded summer temperatures over a decade, and then attributes the gap to sustained municipal planting programs.",
  },
  {
    id: "B",
    text: "It surveys the rise of rooftop gardens across the metropolitan core, catalogs the species best suited to shallow soil beds, and then recommends incentives for property owners who maintain them.",
  },
  {
    id: "C",
    text: "It questions whether vertical forests deliver the air-quality benefits their designers promise, weighs the maintenance costs against measured gains, and then cautions cities against treating them as a cure-all.",
  },
  {
    id: "D",
    text: "It maps the uneven distribution of public parks across older neighborhoods, links the scarcity to historical zoning decisions, and then frames green access as a question of basic equity.",
  },
];

// The "Bad Mold" mode targets transition / contrast verbs that signal a pivot.
const archiveDebateChoices: WordScanChoice[] = [
  {
    id: "A",
    text: "It presents the case for digitizing fragile colonial-era archives before further decay, surveys the funding models other national libraries have used, and then maps a phased timeline for the work.",
  },
  {
    id: "B",
    text: "Contrasts the open-access philosophy of one regional consortium with the subscription model favored by another, traces how each shaped scholarly reach, and then asks which better serves the public record.",
  },
  {
    id: "C",
    text: "It documents the slow loss of audio recordings stored on obsolete magnetic tape, estimates how many hours remain recoverable, and then urges immediate transfer to stable digital formats.",
  },
  {
    id: "D",
    text: "However the chapter complicates the optimistic narrative around mass digitization, exposes the metadata gaps that render scanned pages unsearchable, and then proposes standards to close them.",
  },
];

export const WORD_SCAN_MODES: Record<WordScanMode, WordScanModeConfig> = {
  ceased: {
    name: "Ceased",
    verbs: ["compare", "explain", "argue", "summarize", "emphasize", "describe"],
    questions: [
      // C starts with "describes" — the only Ceased verb.
      { choices: waterDiplomacyChoices, correct: ["C"] },
      // A starts with "Compares" — the only Ceased verb here.
      { choices: urbanGreeneryChoices, correct: ["A"] },
    ],
  },
  "bad-mold": {
    name: "Bad Mold",
    verbs: ["however", "conversely", "contrast", "nevertheless", "whereas", "instead"],
    questions: [
      // B "Contrasts" and D "However" both open with a Bad Mold verb.
      { choices: archiveDebateChoices, correct: ["B", "D"] },
    ],
  },
};
