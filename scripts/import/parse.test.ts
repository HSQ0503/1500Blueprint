import assert from "node:assert/strict";
import test from "node:test";
import * as path from "node:path";
import { docxToContent } from "./parse";

test("preserves Word underline runs as safe markup", async () => {
  const fixture = path.resolve("node_modules/mammoth/test/test-data/underline.docx");
  const { lines } = await docxToContent(fixture);

  assert.equal(lines[0], "The <u>Sunset</u> Tree");
});
