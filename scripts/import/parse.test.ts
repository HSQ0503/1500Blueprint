import assert from "node:assert/strict";
import test from "node:test";
import * as path from "node:path";
import { docxToContent, ommlToLatex } from "./parse";

test("preserves Word underline runs as safe markup", async () => {
  const fixture = path.resolve("node_modules/mammoth/test/test-data/underline.docx");
  const { lines } = await docxToContent(fixture);

  assert.equal(lines[0], "The <u>Sunset</u> Tree");
});

test("converts Word equations to inline LaTeX instead of dropping them", () => {
  assert.equal(
    ommlToLatex(
      '<m:oMath><m:f><m:num><m:rad><m:e><m:r><m:t>2</m:t></m:r></m:e></m:rad></m:num><m:den><m:r><m:t>2</m:t></m:r></m:den></m:f></m:oMath>',
    ),
    "\\frac{\\sqrt{2}}{2}",
  );
  assert.equal(ommlToLatex('<m:oMath><m:r><m:t>π</m:t></m:r></m:oMath>'), "\\pi");
});
