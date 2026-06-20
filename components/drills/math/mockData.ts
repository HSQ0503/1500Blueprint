// Local mock data for the Targeted Math Practice drill (UI-first, no backend).
// Each question carries a deterministic set of accepted exact-match answers so
// grading stays offline: the student's normalized input must equal one of them.

export type MathDifficulty = "medium" | "hard";

export type MathQuestion = {
  id: string;
  prompt: string;
  // Accepted answers as the student would type them (already normalized).
  accepted: string[];
};

export const WIN_TARGET = 10;
export const START_LIVES = 2;
export const SECONDS_PER_QUESTION = 90;

// Normalize a grid-in entry for exact comparison: trim, drop a leading "+",
// strip a stray "$" / "%" / "," (the directions forbid them, but be forgiving),
// and collapse "0.5" vs ".5" by removing a redundant leading zero.
export function normalizeAnswer(raw: string): string {
  let s = raw.trim().replace(/[$,%\s]/g, "");
  if (s.startsWith("+")) s = s.slice(1);
  s = s.replace(/^(-?)0+(\.\d)/, "$1$2");
  return s;
}

export function isCorrect(raw: string, accepted: string[]): boolean {
  const a = normalizeAnswer(raw);
  if (a.length === 0) return false;
  return accepted.some((ans) => normalizeAnswer(ans) === a);
}

export const MEDIUM_QUESTIONS: MathQuestion[] = [
  {
    id: "m1",
    prompt:
      "A club is planning a party. The venue rental is $200, and the food cost per person is $15. Additionally, a fixed decoration cost of $50 is required. The club has a budget of $500. What is the maximum number of people that can attend without exceeding the budget?",
    accepted: ["16"],
  },
  {
    id: "m2",
    prompt:
      "A line in the xy-plane passes through the points (2, 5) and (6, 13). What is the slope of the line?",
    accepted: ["2"],
  },
  {
    id: "m3",
    prompt:
      "A bag contains 8 red marbles and 12 blue marbles. If one marble is selected at random, what is the probability that it is red? Give your answer as a fraction or decimal.",
    accepted: ["2/5", "0.4", ".4"],
  },
  {
    id: "m4",
    prompt:
      "The function f is defined by f(x) = 3x - 7. For what value of x does f(x) = 14?",
    accepted: ["7"],
  },
  {
    id: "m5",
    prompt:
      "A rectangle has a length that is 3 more than twice its width. If the perimeter of the rectangle is 36 units, what is the width of the rectangle?",
    accepted: ["5"],
  },
];

export const HARD_QUESTIONS: MathQuestion[] = [
  {
    id: "h1",
    prompt:
      "In the equation x² - 10x + k = 0, the two solutions are equal. What is the value of k?",
    accepted: ["25"],
  },
  {
    id: "h2",
    prompt:
      "A quantity grows exponentially. It is 200 at time t = 0 and doubles every 5 years. To the nearest whole number, what is the quantity at t = 15?",
    accepted: ["1600"],
  },
  {
    id: "h3",
    prompt:
      "The system of equations 2x + 3y = 12 and 4x - y = 5 has the solution (x, y). What is the value of x? If your answer is a fraction that doesn't fit, enter the decimal rounded to the fourth digit.",
    accepted: ["27/14", "1.9286", "1.928"],
  },
  {
    id: "h4",
    prompt:
      "A right circular cylinder has a volume of 96π cubic centimeters and a height of 6 centimeters. What is the radius of the cylinder, in centimeters?",
    accepted: ["4"],
  },
  {
    id: "h5",
    prompt:
      "If sin(x°) = cos(58°), and 0 < x < 90, what is the value of x?",
    accepted: ["32"],
  },
];

export function questionsFor(difficulty: MathDifficulty): MathQuestion[] {
  return difficulty === "hard" ? HARD_QUESTIONS : MEDIUM_QUESTIONS;
}

// Reference sheet lines shown in the Reference modal (Bluebook-style formulas).
export const REFERENCE_FORMULAS: { label: string; formula: string }[] = [
  { label: "Area of a circle", formula: "A = πr²" },
  { label: "Circumference of a circle", formula: "C = 2πr" },
  { label: "Area of a rectangle", formula: "A = ℓw" },
  { label: "Area of a triangle", formula: "A = ½bh" },
  { label: "Pythagorean theorem", formula: "a² + b² = c²" },
  { label: "Volume of a rectangular box", formula: "V = ℓwh" },
  { label: "Volume of a cylinder", formula: "V = πr²h" },
  { label: "Slope of a line", formula: "m = (y₂ − y₁) / (x₂ − x₁)" },
];

// The grid-in worked examples shown in the left directions pane.
export type GridInExample = {
  answer: { whole?: string; num: string; den?: string; negative?: boolean };
  acceptable: string[];
  unacceptable: string[];
};

export const GRID_IN_EXAMPLES: GridInExample[] = [
  {
    answer: { num: "3.5" },
    acceptable: ["3.5", "3.50", "7/2"],
    unacceptable: ["31/2", "3 1/2"],
  },
  {
    answer: { num: "2", den: "3" },
    acceptable: ["2/3", ".6666", ".6667", "0.666", "0.667"],
    unacceptable: ["0.66", ".66", "0.67", ".67"],
  },
  {
    answer: { num: "1", den: "3", negative: true },
    acceptable: ["-1/3", "-.3333", "-0.333"],
    unacceptable: ["-.33", "-0.33"],
  },
];
