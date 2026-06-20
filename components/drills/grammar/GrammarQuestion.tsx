import type { GrammarQuestion } from "@/lib/drills/types";
import type { ChoiceId } from "@/lib/sat/types";

// Bluebook-neutral question content (serif, royal-blue selection) inside the
// branded drill shell. Passage on the left, prompt + choices on the right;
// stacks on mobile. Squared letter badges and hairline borders keep it crisp.
export function GrammarQuestionView({
  question,
  selected,
  onSelect,
}: {
  question: GrammarQuestion;
  selected: ChoiceId | null;
  onSelect: (id: ChoiceId) => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-0">
      <div className="lg:pr-8">
        <p className="font-serif text-[17px] leading-[1.75] text-exam-ink">{question.passage}</p>
      </div>

      <div className="lg:border-l lg:border-navy/12 lg:pl-8">
        <p className="font-serif text-[17px] font-medium leading-relaxed text-exam-ink">
          {question.prompt}
        </p>
        <div className="mt-4 space-y-2.5">
          {question.choices.map((c) => {
            const isSelected = selected === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c.id)}
                aria-pressed={isSelected}
                className={`flex w-full items-center gap-3 rounded-card border px-4 py-3 text-left transition-colors ${
                  isSelected
                    ? "border-exam-select bg-exam-tint"
                    : "border-exam-border bg-white hover:border-navy/40"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-chip border text-sm font-semibold ${
                    isSelected
                      ? "border-exam-select bg-exam-select text-white"
                      : "border-exam-border text-exam-ink"
                  }`}
                >
                  {c.id}
                </span>
                <span className="font-serif text-[16px] text-exam-ink">{c.text}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
