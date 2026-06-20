// Scoring + adaptive routing.
//
// The real digital SAT uses IRT difficulty-weighted equating with no public
// raw->scaled table. This is a transparent APPROXIMATION designed to be swapped
// for Scott's official conversion tables later (see vault: "1500 — Open Items").
// Key faithful behaviors: per-section 200-800, and the easier module-2 path caps
// the section score below the top of the scale.

import type {
  AnswerMap,
  AnswerValue,
  ModuleVariant,
  PracticeTest,
  Question,
  Section,
  SectionId,
  TestModule,
  Domain,
} from "./types";

export function normalizeGridAnswer(raw: string): string {
  return raw.trim().replace(/\s+/g, "").replace(/^\+/, "");
}

export function isCorrect(q: Question, answer: AnswerValue | undefined): boolean {
  if (answer == null || answer === "") return false;
  if (q.type === "mc") return answer === q.correct;
  const given = normalizeGridAnswer(String(answer));
  return q.acceptedAnswers.some((a) => normalizeGridAnswer(a) === given);
}

export function moduleCorrect(mod: TestModule, answers: AnswerMap): number {
  return mod.questions.reduce(
    (n, q) => n + (isCorrect(q, answers[q.id]) ? 1 : 0),
    0,
  );
}

/** Route into the easier or harder module 2 based on module-1 performance. */
export function routeVariant(
  test: PracticeTest,
  section: Section,
  answers: AnswerMap,
): ModuleVariant {
  const total = section.module1.questions.length;
  if (total === 0) return "easy";
  const frac = moduleCorrect(section.module1, answers) / total;
  return frac >= test.routeThreshold[section.id] ? "hard" : "easy";
}

function roundTo10(n: number): number {
  return Math.round(n / 10) * 10;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// Raw->scaled conversion, one curve per module-2 path.
//
// Real DSAT equating is IRT-based and per-form; College Board publishes no
// conversion table or item parameters, so this is an APPROXIMATION (the same
// approach public score calculators use). Curves are monotonic and plateau at
// the ends; the easy path is capped well below 800 (only the hard path reaches
// it). Values are tunable and meant to be replaced by Scott's official per-form
// tables when available. `frac` is fraction correct across BOTH modules.
type ScaleAnchor = { frac: number; score: number };

const SCALE_CURVES: Record<ModuleVariant, ScaleAnchor[]> = {
  hard: [
    { frac: 0, score: 200 },
    { frac: 0.15, score: 270 },
    { frac: 0.3, score: 360 },
    { frac: 0.45, score: 450 },
    { frac: 0.6, score: 540 },
    { frac: 0.75, score: 630 },
    { frac: 0.88, score: 710 },
    { frac: 0.95, score: 760 },
    { frac: 1, score: 800 },
  ],
  easy: [
    { frac: 0, score: 200 },
    { frac: 0.15, score: 240 },
    { frac: 0.3, score: 310 },
    { frac: 0.45, score: 380 },
    { frac: 0.6, score: 450 },
    { frac: 0.75, score: 520 },
    { frac: 0.88, score: 580 },
    { frac: 0.95, score: 600 },
    { frac: 1, score: 620 },
  ],
};

// Linear interpolation between the two anchors surrounding `frac`.
function interpScore(curve: ScaleAnchor[], frac: number): number {
  const f = clamp(frac, 0, 1);
  for (let i = 1; i < curve.length; i++) {
    const lo = curve[i - 1];
    const hi = curve[i];
    if (f <= hi.frac) {
      return lo.score + ((f - lo.frac) / (hi.frac - lo.frac)) * (hi.score - lo.score);
    }
  }
  return curve[curve.length - 1].score;
}

export type SectionScore = {
  sectionId: SectionId;
  variant: ModuleVariant;
  raw: number;
  total: number;
  scaled: number;
};

export function scoreSection(
  section: Section,
  variant: ModuleVariant,
  answers: AnswerMap,
): SectionScore {
  const mod2 = section.module2[variant];
  const raw = moduleCorrect(section.module1, answers) + moduleCorrect(mod2, answers);
  const total = section.module1.questions.length + mod2.questions.length;
  const frac = total ? raw / total : 0;
  const scaled = clamp(roundTo10(interpScore(SCALE_CURVES[variant], frac)), 200, 800);
  return { sectionId: section.id, variant, raw, total, scaled };
}

export type DomainResult = { domain: Domain; correct: number; total: number };

export function domainBreakdown(
  section: Section,
  variant: ModuleVariant,
  answers: AnswerMap,
): DomainResult[] {
  const counts = new Map<Domain, { correct: number; total: number }>();
  const questions = [
    ...section.module1.questions,
    ...section.module2[variant].questions,
  ];
  for (const q of questions) {
    const entry = counts.get(q.domain) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (isCorrect(q, answers[q.id])) entry.correct += 1;
    counts.set(q.domain, entry);
  }
  return [...counts.entries()].map(([domain, v]) => ({ domain, ...v }));
}

export type TestResult = {
  sections: SectionScore[];
  total: number;
  domains: DomainResult[];
};

export function scoreTest(
  test: PracticeTest,
  routed: Partial<Record<SectionId, ModuleVariant>>,
  answers: AnswerMap,
): TestResult {
  const sections = test.sections.map((s) =>
    scoreSection(s, routed[s.id] ?? "easy", answers),
  );
  const domains = test.sections.flatMap((s) =>
    domainBreakdown(s, routed[s.id] ?? "easy", answers),
  );
  const total = sections.reduce((sum, s) => sum + s.scaled, 0);
  return { sections, total, domains };
}
