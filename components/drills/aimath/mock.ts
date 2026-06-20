// Local mock pool for AI Math Practice (UI-first, no backend). In the real
// product these questions are AI-generated; grading stays objective/exact-match.

export type AiMathChoice = { id: "A" | "B" | "C" | "D"; text: string };

export type AiMathQuestion =
  | {
      id: string;
      kind: "mc";
      prompt: string;
      choices: AiMathChoice[];
      correct: AiMathChoice["id"];
      explanation: string;
    }
  | {
      id: string;
      kind: "grid";
      prompt: string;
      accepted: string[];
      explanation: string;
    };

export function normalize(raw: string): string {
  let s = raw.trim().replace(/[$,%\s]/g, "");
  if (s.startsWith("+")) s = s.slice(1);
  s = s.replace(/^(-?)0+(\.\d)/, "$1$2");
  return s;
}

export function gridCorrect(raw: string, accepted: string[]): boolean {
  const a = normalize(raw);
  return a.length > 0 && accepted.some((x) => normalize(x) === a);
}

export const AI_MATH_QUESTIONS: AiMathQuestion[] = [
  {
    id: "a1",
    kind: "mc",
    prompt: "If 3(x + 4) = 2x + 18, what is the value of x?",
    choices: [
      { id: "A", text: "2" },
      { id: "B", text: "6" },
      { id: "C", text: "10" },
      { id: "D", text: "14" },
    ],
    correct: "B",
    explanation:
      "Distribute to get 3x + 12 = 2x + 18, subtract 2x to get x + 12 = 18, so x = 6.",
  },
  {
    id: "a2",
    kind: "grid",
    prompt:
      "A car travels 150 miles in 2.5 hours at a constant speed. At this rate, how many miles does it travel in 4 hours?",
    accepted: ["240"],
    explanation: "The speed is 150 / 2.5 = 60 miles per hour, and 60 × 4 = 240 miles.",
  },
  {
    id: "a3",
    kind: "mc",
    prompt: "The expression (2x² + 3x) − (x² − 5x) is equivalent to which of the following?",
    choices: [
      { id: "A", text: "x² − 2x" },
      { id: "B", text: "x² + 8x" },
      { id: "C", text: "3x² − 2x" },
      { id: "D", text: "x² − 8x" },
    ],
    correct: "B",
    explanation: "Combine like terms: 2x² − x² = x², and 3x − (−5x) = 8x, giving x² + 8x.",
  },
  {
    id: "a4",
    kind: "grid",
    prompt: "If 40 percent of a number is 26, what is the number?",
    accepted: ["65"],
    explanation: "Let the number be n. Then 0.40n = 26, so n = 26 / 0.40 = 65.",
  },
  {
    id: "a5",
    kind: "mc",
    prompt:
      "A circle in the xy-plane has its center at (0, 0) and a radius of 5. Which point lies on the circle?",
    choices: [
      { id: "A", text: "(2, 4)" },
      { id: "B", text: "(3, 4)" },
      { id: "C", text: "(4, 4)" },
      { id: "D", text: "(5, 5)" },
    ],
    correct: "B",
    explanation: "A point is on the circle when x² + y² = 25. For (3, 4): 9 + 16 = 25.",
  },
];
