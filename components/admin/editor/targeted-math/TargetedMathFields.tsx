"use client";

import { MathText } from "@/components/test/MathText";
import { TrashIcon } from "@/components/test/icons";
import { chip, label, secondaryBtn, surface } from "@/components/drills/shared/ui";
import type { DrillQuestion, FieldEditorProps, TargetedMathContent } from "@/lib/drills/types";

// Narrow the loosely-typed content union to this drill's shape, tolerating older
// rows that predate the `accepted` key.
function asContent(question: DrillQuestion): TargetedMathContent {
  const c = question.content as Partial<TargetedMathContent>;
  return { accepted: Array.isArray(c.accepted) ? c.accepted : [] };
}

// Field editor for the Targeted Math (grid-in) drill. Stem/passage/explanation/
// figure are owned by the shared shell; here we only edit the set of accepted
// exact-match answers (e.g. ["2/5", "0.4", ".4"]).
export function Fields({ question, onChange }: FieldEditorProps) {
  const { accepted } = asContent(question);

  function commit(next: string[]) {
    onChange({ content: { accepted: next } });
  }

  function setAt(index: number, value: string) {
    commit(accepted.map((a, i) => (i === index ? value : a)));
  }

  function removeAt(index: number) {
    commit(accepted.filter((_, i) => i !== index));
  }

  function add() {
    commit([...accepted, ""]);
  }

  return (
    <div>
      <div className={`${label} text-navy/50`}>Accepted answers</div>
      <p className="mt-1 text-sm text-navy/55">
        Each entry is matched exactly (after normalizing whitespace, $, %, commas
        and leading zeros). Add every acceptable form, e.g. a fraction and its
        decimal.
      </p>

      <div className="mt-3 space-y-2">
        {accepted.length === 0 ? (
          <p className="text-sm text-navy/40">No accepted answers yet.</p>
        ) : (
          accepted.map((value, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                value={value}
                onChange={(e) => setAt(index, e.target.value)}
                inputMode="text"
                autoComplete="off"
                placeholder="e.g. 2/5"
                className="w-44 rounded-card border border-navy/25 bg-white px-3 py-2 text-center font-serif text-base tabular-nums text-exam-ink outline-none transition-colors placeholder:text-navy/30 focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label="Remove answer"
                className="rounded-card border border-navy/15 p-2 text-navy/50 transition-colors hover:bg-danger-bg hover:text-danger-600"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <button type="button" onClick={add} className={`${secondaryBtn} mt-3`}>
        Add answer
      </button>
    </div>
  );
}

// Read-only, student-faithful render of the question card: the prompt (stem),
// a grid-in answer box, and the accepted answers.
export function Preview({ question }: { question: DrillQuestion }) {
  const { accepted } = asContent(question);
  const prompt = question.stem?.trim();

  return (
    <div className={`${surface} p-5`}>
      <p className="font-serif text-[17px] leading-relaxed text-exam-ink">
        {prompt ? <MathText>{prompt}</MathText> : <span className="text-navy/35">No prompt yet</span>}
      </p>

      <div className={`${label} mt-6 text-navy/50`}>Enter your answer</div>
      <div className="mt-2 w-44 rounded-card border border-navy/25 bg-white px-3 py-2 text-center font-serif text-lg text-navy/30">
        Type your answer
      </div>

      <div className={`${label} mt-5 text-navy/50`}>Accepted answers</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {accepted.length === 0 ? (
          <span className="text-sm text-navy/40">None set</span>
        ) : (
          accepted.map((a, i) => (
            <span key={i} className={`${chip} bg-success-bg text-success-600`}>
              <MathText>{a}</MathText>
            </span>
          ))
        )}
      </div>
    </div>
  );
}
