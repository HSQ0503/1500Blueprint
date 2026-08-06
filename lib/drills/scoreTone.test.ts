import assert from "node:assert/strict";
import test from "node:test";
import { scoreToneFor } from "./scoreTone";

test("the default score tone keeps 85 in the warning range", () => {
  assert.equal(scoreToneFor(85), "warning");
  assert.equal(scoreToneFor(100), "success");
});

test("a reading score of 85 uses the success tone", () => {
  assert.equal(scoreToneFor(85, 85), "success");
});

test("a reading score below 85 does not use the success tone", () => {
  assert.equal(scoreToneFor(84, 85), "warning");
  assert.equal(scoreToneFor(49, 85), "danger");
});
