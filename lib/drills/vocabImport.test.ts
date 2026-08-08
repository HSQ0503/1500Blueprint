import assert from "node:assert/strict";
import test from "node:test";
import { buildVocabQuestions, parseVocabImport } from "./vocabImport";

test("CSV imports quoted definitions and normalized headers", () => {
  const result = parseVocabImport(
    'Term,Meaning,Part of Speech,Example\n"laconic","using few words, often terse",adj.,"Her reply was laconic."',
    "words.csv",
  );

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.entries, [
    {
      word: "laconic",
      definition: "using few words, often terse",
      pos: "adj.",
      example: "Her reply was laconic.",
    },
  ]);
});

test("CSV imports exported with a UTF-8 byte-order mark", () => {
  const result = parseVocabImport(
    "\uFEFFword,definition,pos,example\npragmatic,focused on practical results,adj.,a pragmatic plan",
    "excel-export.csv",
  );

  assert.deepEqual(result.errors, []);
  assert.equal(result.entries[0]?.word, "pragmatic");
});

test("TSV and pipe-delimited TXT imports are accepted", () => {
  const tsv = parseVocabImport("word\tdefinition\tpos\nephemeral\tlasting briefly\tadj.", "words.tsv");
  const txt = parseVocabImport("assuage | to make less intense | v.", "words.txt");

  assert.equal(tsv.entries[0]?.word, "ephemeral");
  assert.equal(txt.entries[0]?.definition, "to make less intense");
  assert.deepEqual([...tsv.errors, ...txt.errors], []);
});

test("JSON arrays are accepted and malformed or duplicate rows are reported", () => {
  const result = parseVocabImport(
    JSON.stringify([
      { word: "candor", definition: "honesty" },
      { term: "Candor", meaning: "duplicate" },
      { word: "tenuous" },
    ]),
    "words.json",
  );

  assert.equal(result.entries.length, 1);
  assert.equal(result.errors.length, 2);
  assert.match(result.errors[0] ?? "", /duplicate/i);
  assert.match(result.errors[1] ?? "", /definition/i);
});

test("a 1,001-word file builds published four-option drill questions", () => {
  const csv = ["word,definition,pos"];
  for (let index = 0; index < 1001; index += 1) {
    csv.push(`word${index},definition ${index},n.`);
  }

  const parsed = parseVocabImport(csv.join("\n"), "large.csv");
  const questions = buildVocabQuestions(parsed.entries);

  assert.equal(parsed.errors.length, 0);
  assert.equal(questions.length, 1001);
  assert.equal(questions.every((question) => question.options.length === 4), true);
  assert.equal(
    questions.every((question) => question.options[question.correctIndex] === question.word),
    true,
  );
});
