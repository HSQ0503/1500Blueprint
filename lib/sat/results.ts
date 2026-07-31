import { moduleKey } from "./modules";
import { isCorrect, scoreTest, type TestResult } from "./scoring";
import type {
  AnswerMap,
  Difficulty,
  Domain,
  ModuleVariant,
  PracticeTest,
  Question,
  Section,
  SectionId,
  TestModule,
} from "./types";

export type BreakdownRow = {
  label: string;
  correct: number;
  total: number;
  accuracy: number;
};

export type AdministeredModule = {
  key: string;
  label: string;
  shortLabel: string;
  section: Section;
  module: TestModule;
};

export type ModuleAnalytics = {
  correct: number;
  total: number;
  accuracy: number;
  timeSeconds: number;
  byDifficulty: BreakdownRow[];
  bySubject: BreakdownRow[];
  byTopic: BreakdownRow[];
};

export type PerformanceSummary = {
  heading: string;
  body: string;
  nextSteps: string[];
};

export function administeredModules(
  test: PracticeTest,
  routed: Partial<Record<SectionId, ModuleVariant>>,
): AdministeredModule[] {
  return test.sections.flatMap((section) => {
    const variant = routed[section.id] ?? "easy";
    const sectionLabel = section.id === "rw" ? "Reading & Writing" : "Math";
    return [
      {
        key: moduleKey(section.id, 1),
        label: `${sectionLabel} Module 1`,
        shortLabel: `${section.id === "rw" ? "R&W" : "Math"} M1`,
        section,
        module: section.module1,
      },
      {
        key: moduleKey(section.id, 2, variant),
        label: `${sectionLabel} Module 2`,
        shortLabel: `${section.id === "rw" ? "R&W" : "Math"} M2`,
        section,
        module: section.module2[variant],
      },
    ];
  });
}

export function subjectFor(sectionId: SectionId, question: Question): string {
  if (sectionId === "math") return question.domain;
  return question.domain === "Standard English Conventions" ? "Grammar" : "Reading";
}

export function topicFor(question: Question): string {
  return question.skill?.trim() || question.domain;
}

function breakdown(
  questions: Question[],
  answers: AnswerMap,
  labelFor: (question: Question) => string,
  preferredOrder: string[] = [],
): BreakdownRow[] {
  const rows = new Map<string, { correct: number; total: number }>();
  for (const question of questions) {
    const label = labelFor(question);
    const row = rows.get(label) ?? { correct: 0, total: 0 };
    row.total += 1;
    if (isCorrect(question, answers[question.id])) row.correct += 1;
    rows.set(label, row);
  }
  return [...rows.entries()]
    .map(([label, row]) => ({
      label,
      ...row,
      accuracy: row.total ? Math.round((row.correct / row.total) * 100) : 0,
    }))
    .sort((a, b) => {
      const ai = preferredOrder.indexOf(a.label);
      const bi = preferredOrder.indexOf(b.label);
      if (ai >= 0 || bi >= 0) return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
      return b.total - a.total || a.label.localeCompare(b.label);
    });
}

export function analyzeModule(
  sectionId: SectionId,
  module: TestModule,
  answers: AnswerMap,
  perQuestionTime: Record<string, number>,
): ModuleAnalytics {
  const correct = module.questions.reduce(
    (count, question) => count + (isCorrect(question, answers[question.id]) ? 1 : 0),
    0,
  );
  const total = module.questions.length;
  return {
    correct,
    total,
    accuracy: total ? Math.round((correct / total) * 100) : 0,
    timeSeconds: module.questions.reduce((sum, question) => sum + (perQuestionTime[question.id] ?? 0), 0),
    byDifficulty: breakdown(
      module.questions,
      answers,
      (question) => question.difficulty,
      ["easy", "medium", "hard"] satisfies Difficulty[],
    ),
    bySubject: breakdown(module.questions, answers, (question) => subjectFor(sectionId, question)),
    byTopic: breakdown(module.questions, answers, topicFor),
  };
}

type TopicStat = BreakdownRow & { domain: Domain; timeSeconds: number; omitted: number };

function testTopics(
  test: PracticeTest,
  routed: Partial<Record<SectionId, ModuleVariant>>,
  answers: AnswerMap,
  perQuestionTime: Record<string, number>,
): TopicStat[] {
  const stats = new Map<string, TopicStat>();
  for (const administered of administeredModules(test, routed)) {
    for (const question of administered.module.questions) {
      const label = topicFor(question);
      const row = stats.get(label) ?? {
        label,
        domain: question.domain,
        correct: 0,
        total: 0,
        accuracy: 0,
        timeSeconds: 0,
        omitted: 0,
      };
      row.total += 1;
      row.timeSeconds += perQuestionTime[question.id] ?? 0;
      const answer = answers[question.id];
      if (answer == null || String(answer).trim() === "") row.omitted += 1;
      if (isCorrect(question, answer)) row.correct += 1;
      row.accuracy = Math.round((row.correct / row.total) * 100);
      stats.set(label, row);
    }
  }
  return [...stats.values()];
}

export function buildPerformanceSummary(
  test: PracticeTest,
  routed: Partial<Record<SectionId, ModuleVariant>>,
  answers: AnswerMap,
  perQuestionTime: Record<string, number>,
): PerformanceSummary & { result: TestResult } {
  const result = scoreTest(test, routed, answers);
  const topics = testTopics(test, routed, answers, perQuestionTime);
  const rankedWeaknesses = topics
    .filter((topic) => topic.total > 0)
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total);
  const strongest = [...topics].sort((a, b) => b.accuracy - a.accuracy || b.total - a.total)[0];
  const weakest = rankedWeaknesses[0];
  const slowest = [...topics]
    .filter((topic) => topic.total > 0)
    .sort((a, b) => b.timeSeconds / b.total - a.timeSeconds / a.total)[0];
  const omitted = topics.reduce((sum, topic) => sum + topic.omitted, 0);

  const nextSteps: string[] = [];
  if (weakest) {
    nextSteps.push(
      `Start with ${weakest.label} (${weakest.correct}/${weakest.total}). Review the underlying rule, then complete a short targeted set before your next full test.`,
    );
  }
  const secondWeakest = rankedWeaknesses.find((topic) => topic.label !== weakest?.label);
  if (secondWeakest) {
    nextSteps.push(
      `Next, reinforce ${secondWeakest.label} (${secondWeakest.accuracy}% accuracy). Correct the missed questions without looking at the explanation first.`,
    );
  }
  if (slowest && slowest.label !== weakest?.label) {
    nextSteps.push(
      `Build speed in ${slowest.label}. You averaged ${Math.round(slowest.timeSeconds / Math.max(1, slowest.total))} seconds per question there.`,
    );
  }
  if (omitted > 0) {
    nextSteps.push(
      `Eliminate omissions: ${omitted} ${omitted === 1 ? "question was" : "questions were"} left blank. Reserve the final two minutes of each module for a complete answer check.`,
    );
  } else {
    nextSteps.push("Keep the no-omission habit and retake the weakest module after targeted practice to confirm the gain.");
  }

  const rw = result.sections.find((section) => section.sectionId === "rw")?.scaled ?? 200;
  const math = result.sections.find((section) => section.sectionId === "math")?.scaled ?? 200;
  const strongerSection = rw === math ? "Both sections were balanced" : rw > math ? "Reading & Writing led Math" : "Math led Reading & Writing";
  const strengthText = strongest
    ? `Your clearest strength was ${strongest.label} at ${strongest.accuracy}% accuracy.`
    : "Your next test will establish a more detailed skill baseline.";

  return {
    result,
    heading: result.total >= 1400 ? "Strong result - now convert the remaining misses." : result.total >= 1200 ? "A solid base with clear points available." : "Your baseline is set - the next gains are specific.",
    body: `You scored ${result.total}/1600. ${strongerSection} (${rw} vs. ${math}). ${strengthText}`,
    nextSteps: nextSteps.slice(0, 4),
  };
}
