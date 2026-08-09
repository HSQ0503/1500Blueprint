import assert from "node:assert/strict";
import test from "node:test";
import { normalizeGridInInput } from "./gridIn";

test("limits grid-in answers to five characters without counting a leading minus sign", () => {
  assert.equal(normalizeGridInInput("123456"), "12345");
  assert.equal(normalizeGridInInput("12.345"), "12.34");
  assert.equal(normalizeGridInInput("-12.345"), "-12.34");
  assert.equal(normalizeGridInInput("-123456"), "-12345");
  assert.equal(normalizeGridInInput("123/45"), "123/4");
});

test("allows one sign and one decimal or fraction separator", () => {
  assert.equal(normalizeGridInInput("--1a2//3.4"), "-12/34");
  assert.equal(normalizeGridInInput("-.5"), "-.5");
});
