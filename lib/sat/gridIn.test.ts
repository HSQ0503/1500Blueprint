import assert from "node:assert/strict";
import test from "node:test";
import { normalizeGridInInput } from "./gridIn";

test("limits grid-in answers to four numeric digits", () => {
  assert.equal(normalizeGridInInput("12345"), "1234");
  assert.equal(normalizeGridInInput("-12.345"), "-12.34");
  assert.equal(normalizeGridInInput("123/45"), "123/4");
});

test("allows one sign and one decimal or fraction separator", () => {
  assert.equal(normalizeGridInInput("--1a2//3.4"), "-12/34");
  assert.equal(normalizeGridInInput("-.5"), "-.5");
});
