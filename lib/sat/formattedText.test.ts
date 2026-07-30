import assert from "node:assert/strict";
import test from "node:test";
import { parseUnderlineMarkup } from "./formattedText";

test("parses safe underline markup", () => {
  assert.deepEqual(parseUnderlineMarkup("Before <u>underlined</u> after"), [
    { text: "Before ", underlined: false },
    { text: "underlined", underlined: true },
    { text: " after", underlined: false },
  ]);
});

test("supports multiple and multiline underlines", () => {
  assert.deepEqual(parseUnderlineMarkup("<u>First</u>\n<u>Second line</u>"), [
    { text: "First", underlined: true },
    { text: "\n", underlined: false },
    { text: "Second line", underlined: true },
  ]);
});

test("leaves unsupported or incomplete HTML as plain text", () => {
  assert.deepEqual(parseUnderlineMarkup("<strong>Bold</strong> <u>unfinished"), [
    { text: "<strong>Bold</strong> <u>unfinished", underlined: false },
  ]);
});
