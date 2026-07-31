import assert from "node:assert/strict";
import test from "node:test";
import { analyzeModule, administeredModules, buildPerformanceSummary, topicFor } from "./results";
import type { Domain, MultipleChoiceQuestion, PracticeTest, SectionId } from "./types";

function question(id: string, domain: Domain, skill: string, difficulty: "easy" | "medium" | "hard"): MultipleChoiceQuestion {
  return {
    id,
    type: "mc",
    domain,
    skill,
    difficulty,
    prompt: `Prompt ${id}`,
    choices: [
      { id: "A", text: "Correct" },
      { id: "B", text: "Incorrect" },
      { id: "C", text: "Incorrect" },
      { id: "D", text: "Incorrect" },
    ],
    correct: "A",
    explanation: `Explanation ${id}`,
  };
}

const rw1 = question("rw-1", "Standard English Conventions", "Punctuation", "easy");
const rw2 = question("rw-2", "Information and Ideas", "Command of Evidence", "hard");
const math1 = question("math-1", "Algebra", "Linear equations", "medium");
const math2 = question("math-2", "Advanced Math", "Nonlinear functions", "hard");

const practiceTest: PracticeTest = {
  id: "analytics-test",
  title: "Analytics Test",
  breakMinutes: 10,
  routeThreshold: { rw: 0.75, math: 0.75 },
  sections: [
    {
      id: "rw",
      name: "Reading and Writing",
      shortName: "Reading and Writing",
      minutesPerModule: 32,
      module1: { id: "rw-m1", order: 1, questions: [rw1] },
      module2: {
        easy: { id: "rw-m2-e", order: 2, variant: "easy", questions: [rw2] },
        hard: { id: "rw-m2-h", order: 2, variant: "hard", questions: [rw2] },
      },
    },
    {
      id: "math",
      name: "Math",
      shortName: "Math",
      minutesPerModule: 35,
      module1: { id: "math-m1", order: 1, questions: [math1] },
      module2: {
        easy: { id: "math-m2-e", order: 2, variant: "easy", questions: [math2] },
        hard: { id: "math-m2-h", order: 2, variant: "hard", questions: [math2] },
      },
    },
  ],
};

const routed: Partial<Record<SectionId, "easy" | "hard">> = { rw: "easy", math: "easy" };
const answers = { "rw-1": "A" as const, "rw-2": "B" as const, "math-1": "A" as const };
const perQuestionTime = { "rw-1": 30, "rw-2": 75, "math-1": 40, "math-2": 90 };

test("administered modules contain only the routed module two variants", () => {
  const modules = administeredModules(practiceTest, routed);
  assert.equal(modules.length, 4);
  assert.deepEqual(modules.map((module) => module.module.id), ["rw-m1", "rw-m2-e", "math-m1", "math-m2-e"]);
});

test("module analytics calculate correctness, time, difficulty, subject, and topic", () => {
  const analytics = analyzeModule("rw", practiceTest.sections[0].module2.easy, answers, perQuestionTime);
  assert.equal(analytics.correct, 0);
  assert.equal(analytics.total, 1);
  assert.equal(analytics.accuracy, 0);
  assert.equal(analytics.timeSeconds, 75);
  assert.deepEqual(analytics.byDifficulty[0], { label: "hard", correct: 0, total: 1, accuracy: 0 });
  assert.equal(analytics.bySubject[0].label, "Reading");
  assert.equal(analytics.byTopic[0].label, "Command of Evidence");
  assert.equal(topicFor(rw2), "Command of Evidence");
});

test("performance summary is personalized from scored topics and timing", () => {
  const summary = buildPerformanceSummary(practiceTest, routed, answers, perQuestionTime);
  assert.match(summary.body, new RegExp(`You scored ${summary.result.total}/1600`));
  assert.ok(summary.nextSteps.some((step) => step.includes("Command of Evidence")));
  assert.ok(summary.nextSteps.some((step) => step.includes("left blank")));
  assert.ok(summary.nextSteps.length <= 4);
});
