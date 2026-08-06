"use client";

import type { ChoiceId, MultipleChoiceQuestion } from "@/lib/sat/types";
import { MathText } from "./MathText";

type Props = {
  question: MultipleChoiceQuestion;
  selected: ChoiceId | undefined;
  eliminated: ChoiceId[];
  eliminatorOn: boolean;
  onSelect: (id: ChoiceId) => void;
  onToggleEliminate: (id: ChoiceId) => void;
};

export function AnswerChoices({
  question,
  selected,
  eliminated,
  eliminatorOn,
  onSelect,
  onToggleEliminate,
}: Props) {
  return (
    <ul className="flex flex-col gap-4 font-serif">
      {question.choices.map((choice) => {
        const isSelected = selected === choice.id;
        const isEliminated = eliminated.includes(choice.id);
        return (
          <li key={choice.id} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onSelect(choice.id)}
              aria-pressed={isSelected}
              disabled={isEliminated}
              className={`relative flex w-full cursor-pointer items-center gap-4 rounded-xl bg-white px-5 py-4 text-left transition-colors ${
                isSelected
                  ? "border border-exam-blue ring-2 ring-inset ring-exam-blue"
                  : "border border-[#b4b8c1] hover:border-exam-ink/45"
              } ${isEliminated ? "pointer-events-none" : ""}`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[17px] font-normal ${
                  isSelected
                    ? "bg-exam-select text-white"
                    : "border border-exam-ink/35 text-exam-ink"
                } ${isEliminated ? "opacity-45" : ""}`}
              >
                {choice.id}
              </span>
              <span
                className={`whitespace-pre-line text-[17px] leading-6 text-exam-ink ${
                  isEliminated ? "opacity-45" : ""
                }`}
              >
                <MathText>{choice.text}</MathText>
              </span>

              {/* full-row strike when eliminated */}
              {isEliminated && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-4 top-1/2 h-0.5 -translate-y-1/2 bg-exam-strike"
                />
              )}
            </button>

            {/* right-margin cross-out control */}
            <div className="flex w-12 shrink-0 justify-center">
              {eliminatorOn &&
                (isEliminated ? (
                  <button
                    type="button"
                    onClick={() => onToggleEliminate(choice.id)}
                    className="cursor-pointer text-sm font-semibold text-exam-ink underline underline-offset-2 hover:text-exam-blue"
                  >
                    Undo
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onToggleEliminate(choice.id)}
                    aria-label={`Cross out choice ${choice.id}`}
                    className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-exam-ink/55 text-xs font-semibold leading-none text-exam-ink hover:bg-exam-ink/5"
                  >
                    <span className="leading-none">{choice.id}</span>
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-1/2 top-1/2 h-0.5 w-8 -translate-x-1/2 -translate-y-1/2 bg-exam-ink"
                    />
                  </button>
                ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
