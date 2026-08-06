import assert from "node:assert/strict";
import test from "node:test";
import { parseTest6Lines } from "./parse-test6";

test("parses Test 6 choices, supplied explanations, tables, and figures", () => {
  const modules = parseTest6Lines([
    "Reading/Writing",
    "Baseline",
    "1)",
    "| Year | Value |@@ROW@@|---|---|@@ROW@@| 2025 | 10 |",
    "Which choice best uses the table? MEDIUM, SCIENCE",
    "[[IMG:image1.png]]",
    "A) First",
    "B) Second",
    "C) Third",
    "D) Fourth",
    "EXPLANATION",
    "Choice C is the best answer because it agrees with the table.",
    "Choice A is incorrect because it does not.",
    "Choice B is incorrect because it does not.",
    "Choice D is incorrect because it does not.",
  ]);

  const question = modules[0].questions[0];
  assert.equal(question.type, "mc");
  assert.equal(question.correct, "C");
  assert.equal(question.difficulty, "medium");
  assert.equal(question.prompt, "Which choice best uses the table?");
  assert.match(question.passage ?? "", /@@ROW@@/);
  assert.equal(question.figure, "image1.png");
  assert.equal(question.explanationSource, "human");
  assert.match(question.choices[2].explanation ?? "", /^Choice C is the best answer/);
});

test("handles the source's one missing EXPLANATION heading", () => {
  const modules = parseTest6Lines([
    "Math",
    "Hard",
    "1)",
    "Which equation is correct?",
    "A) x = 1",
    "B) x = 2",
    "C) x = 3",
    "D) x = 4",
    "Choice B is the best answer because x equals 2.",
    "Choice A is incorrect.",
    "Choice C is incorrect.",
    "Choice D is incorrect.",
    "Topic: Algebra",
    "Difficulty: Hard",
  ]);

  const question = modules[0].questions[0];
  assert.equal(question.correct, "B");
  assert.equal(question.choices[3].text, "x = 4");
  assert.match(question.explanation ?? "", /^Choice B is the best answer/);
});

test("preserves an explicit grid-in answer without inventing an explanation", () => {
  const modules = parseTest6Lines([
    "Math",
    "Hard",
    "1)",
    "What is the value of k?",
    "Answer: -7",
    "Topic: Advanced Math",
    "Difficulty: Hard",
  ]);

  const question = modules[0].questions[0];
  assert.equal(question.type, "grid");
  assert.deepEqual(question.acceptedAnswers, ["-7"]);
  assert.equal(question.explanation, null);
  assert.deepEqual(question.notes, ["missing supplied explanation"]);
});
