import type { WordScanChoice } from "./mock";

// A single tappable answer-choice card on the playing screen. Serif body (exam
// content), hairline border, a squared letter badge. Tapped = flagged with the
// electric brand accent. Pure/presentational; the runner owns selection state.

export function ChoiceCard({
  choice,
  flagged,
  disabled,
  onToggle,
}: {
  choice: WordScanChoice;
  flagged: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-pressed={flagged}
      className={`group flex w-full items-start gap-3.5 rounded-card border px-4 py-3.5 text-left transition-colors disabled:cursor-default sm:px-5 sm:py-4 ${
        flagged
          ? "border-brand bg-brand/8 ring-1 ring-brand"
          : "border-navy/15 bg-white hover:border-navy/30 hover:bg-navy/[0.02]"
      }`}
    >
      <span
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-chip border text-[13px] font-semibold transition-colors ${
          flagged
            ? "border-brand bg-brand text-white"
            : "border-navy/20 bg-navy/[0.04] text-navy/55 group-hover:text-navy/75"
        }`}
      >
        {choice.id}
      </span>
      <span
        className={`font-serif text-[15px] leading-relaxed transition-colors ${
          flagged ? "text-navy" : "text-exam-ink"
        }`}
      >
        {choice.text}
      </span>
    </button>
  );
}
