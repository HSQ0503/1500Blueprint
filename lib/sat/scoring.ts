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
  // Hard path can reach 800; easy path caps near 600 even at 100% (approx).
  const span = variant === "hard" ? 600 : 400;
  const scaled = clamp(roundTo10(200 + frac * span), 200, 800);
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
