"use client";

import type { FieldEditorProps, VocabContent } from "@/lib/drills/types";
import { label } from "@/components/drills/shared/ui";

// Field editor for the Vocab drill. Edits ONLY question.content: a
// part-of-speech tag, a definition, four word options, and which option is the
// correct match. The shared shell owns stem/passage/explanation/metadata.

// Tolerate older/partial content by coercing to a 4-option shape.
function normalize(content: FieldEditorProps["question"]["content"]): VocabContent {
  const c = content as Partial<VocabContent>;
  const options = Array.isArray(c.options) ? c.options.slice(0, 4) : [];
  while (options.length < 4) options.push("");
  const correctIndex =
    typeof c.correctIndex === "number" && c.correctIndex >= 0 && c.correctIndex < 4
      ? c.correctIndex
      : 0;
  return {
    pos: typeof c.pos === "string" ? c.pos : "",
    definition: typeof c.definition === "string" ? c.definition : "",
    options,
    correctIndex,
  };
}

const inputCls =
  "w-full rounded-card border border-navy/15 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-navy/30 focus:border-brand/60";

export function Fields({ question, onChange }: FieldEditorProps) {
  const content = normalize(question.content);

  function patch(next: Partial<VocabContent>) {
    onChange({ content: { ...content, ...next } });
  }

  function setOption(i: number, value: string) {
    const options = content.options.map((o, idx) => (idx === i ? value : o));
    // correctIndex is positional, so editing an option's text never moves the key.
    patch({ options });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[140px_1fr]">
        <div>
          <label className={`${label} mb-1.5 block text-navy/55`} htmlFor="vocab-pos">
            Part of Speech
          </label>
          <input
            id="vocab-pos"
            type="text"
            value={content.pos}
            onChange={(e) => patch({ pos: e.target.value })}
            placeholder="adj."
            className={inputCls}
          />
        </div>
        <div>
          <label className={`${label} mb-1.5 block text-navy/55`} htmlFor="vocab-def">
            Definition
          </label>
          <textarea
            id="vocab-def"
            rows={3}
            value={content.definition}
            onChange={(e) => patch({ definition: e.target.value })}
            placeholder="out of place in time; outdated, misplaced"
            className={`${inputCls} resize-y leading-relaxed`}
          />
        </div>
      </div>

      <div>
        <div className={`${label} mb-2 text-navy/55`}>Word Options</div>
        <div className="space-y-2.5">
          {content.options.map((option, i) => {
            const isCorrect = i === content.correctIndex;
            return (
              <div key={i} className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-card border border-navy/15 bg-paper/40 font-serif text-sm text-navy/55">
                  {String.fromCharCode(65 + i)}
                </span>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => setOption(i, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  className={`${inputCls} font-serif ${isCorrect ? "border-success/60 bg-success-bg" : ""}`}
                />
                <label
                  className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-card border px-3 py-2 text-xs font-semibold transition-colors ${
                    isCorrect
                      ? "border-success/60 bg-success-bg text-success-600"
                      : "border-navy/15 bg-white text-navy/50 hover:bg-navy/5"
                  }`}
                >
                  <input
                    type="radio"
                    name="vocab-correct"
                    className="sr-only"
                    checked={isCorrect}
                    onChange={() => patch({ correctIndex: i })}
                  />
                  Correct
                </label>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-navy/45">
          Enter four word options and mark exactly one as correct.
        </p>
      </div>
    </div>
  );
}
