import type { DrillQuestion, VocabContent } from "@/lib/drills/types";
import { MathText } from "@/components/test/MathText";
import { surface, labelMuted } from "@/components/drills/shared/ui";
import { CheckIcon } from "@/components/test/icons";

// Read-only, student-faithful render of a Vocab question card. Mirrors
// components/drills/vocab/VocabQuestion.tsx: a serif definition card above four
// full-width word options, with the correct option marked green.

function normalize(content: DrillQuestion["content"]): VocabContent {
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

export function Preview({ question }: { question: DrillQuestion }) {
  const { pos, definition, options, correctIndex } = normalize(question.content);

  return (
    <div className="mx-auto max-w-3xl">
      <div className={`${surface} p-6 sm:p-8`}>
        <div className={labelMuted}>Definition</div>
        <p className="mt-3 font-serif text-2xl leading-snug text-ink sm:text-[28px]">
          {pos && <span className="text-navy/50">({pos})</span>}{" "}
          <MathText>{definition || "Definition appears here."}</MathText>
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {options.map((option, i) => {
          const isCorrect = i === correctIndex;
          return (
            <div
              key={i}
              className={`flex items-center justify-between gap-3 rounded-card border px-5 py-4 ${
                isCorrect ? "border-success bg-success-bg" : "border-navy/15 bg-white"
              }`}
            >
              <span
                className={`font-serif text-lg ${isCorrect ? "text-success-600" : "text-ink"}`}
              >
                {option ? <MathText>{option}</MathText> : `Option ${String.fromCharCode(65 + i)}`}
              </span>
              {isCorrect && <CheckIcon className="h-5 w-5 shrink-0 text-success" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
