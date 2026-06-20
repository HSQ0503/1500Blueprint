import type { VocabItem } from "./mock";
import { surface, labelMuted } from "../shared/ui";
import { BookmarkIcon, BookmarkFilledIcon, CheckIcon, CloseIcon } from "@/components/test/icons";

// One vocab round: a serif DEFINITION card above four full-width word options.
// Selection is a deterministic exact match — correct turns green (success),
// wrong turns red (danger) and the correct answer is revealed. Each option
// carries a trailing bookmark to save that word to the Vocab Flashcards deck.

type OptionState = "idle" | "correct" | "wrong" | "reveal";

function optionState(option: string, item: VocabItem, selected: string | null): OptionState {
  if (selected === null) return "idle";
  if (option === selected) return option === item.correct ? "correct" : "wrong";
  if (option === item.correct) return "reveal";
  return "idle";
}

const rowStyles: Record<OptionState, string> = {
  idle: "border-navy/15 bg-white hover:border-brand/60 hover:bg-ice/40",
  correct: "border-success bg-success-bg",
  wrong: "border-danger bg-danger-bg",
  reveal: "border-success bg-success-bg",
};

const wordStyles: Record<OptionState, string> = {
  idle: "text-ink",
  correct: "text-success-600",
  wrong: "text-danger-600",
  reveal: "text-success-600",
};

export function VocabQuestion({
  item,
  selected,
  saved,
  onSelect,
  onToggleSave,
}: {
  item: VocabItem;
  selected: string | null;
  saved: Record<string, boolean>;
  onSelect: (word: string) => void;
  onToggleSave: (word: string) => void;
}) {
  const locked = selected !== null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className={`${surface} p-6 sm:p-8`}>
        <div className={labelMuted}>Definition</div>
        <p className="mt-3 font-serif text-2xl leading-snug text-ink sm:text-[28px]">
          <span className="text-navy/50">({item.pos})</span> {item.definition}
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {item.options.map((option) => {
          const state = optionState(option, item, selected);
          const isSaved = saved[option] ?? false;
          return (
            <div key={option} className="flex items-stretch gap-3">
              <button
                type="button"
                disabled={locked}
                onClick={() => onSelect(option)}
                aria-pressed={selected === option}
                className={`flex flex-1 items-center justify-between gap-3 rounded-card border px-5 py-4 text-left transition-colors disabled:cursor-default ${rowStyles[state]}`}
              >
                <span className={`font-serif text-lg ${wordStyles[state]}`}>{option}</span>
                <FeedbackMark state={state} />
              </button>

              <button
                type="button"
                onClick={() => onToggleSave(option)}
                aria-pressed={isSaved}
                aria-label={isSaved ? `Remove ${option} from flashcards` : `Save ${option} to flashcards`}
                title={isSaved ? "Saved to Vocab Flashcards" : "Save to Vocab Flashcards"}
                className={`flex w-14 shrink-0 items-center justify-center rounded-card border transition-colors ${
                  isSaved
                    ? "border-gold/60 bg-gold/10 text-gold-600"
                    : "border-navy/15 bg-white text-navy/35 hover:border-navy/30 hover:text-navy/60"
                }`}
              >
                {isSaved ? (
                  <BookmarkFilledIcon className="h-5 w-5" />
                ) : (
                  <BookmarkIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FeedbackMark({ state }: { state: OptionState }) {
  if (state === "correct" || state === "reveal") {
    return <CheckIcon className="h-5 w-5 shrink-0 text-success" />;
  }
  if (state === "wrong") {
    return <CloseIcon className="h-5 w-5 shrink-0 text-danger" />;
  }
  return null;
}
