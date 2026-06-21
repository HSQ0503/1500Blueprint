"use client";

import { ChevronUpIcon } from "./icons";

type Props = {
  studentName: string;
  questionLabel?: string;
  showCenter?: boolean;
  canBack: boolean;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  onToggleNavigator?: () => void;
  navigatorOpen?: boolean;
};

export function FooterNav({
  studentName,
  questionLabel,
  showCenter = true,
  canBack,
  onBack,
  onNext,
  nextLabel = "Next",
  onToggleNavigator,
  navigatorOpen,
}: Props) {
  return (
    <div className="font-exam-sans">
      <div className="bb-perf" />
      <footer className="relative flex items-center justify-between gap-2 bg-exam-chrome px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3">
        <span className="hidden text-[15px] font-medium text-exam-ink sm:block">
          {studentName}
        </span>

        {showCenter && questionLabel && (
          <button
            type="button"
            onClick={onToggleNavigator}
            aria-expanded={navigatorOpen}
            className="absolute left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-lg bg-exam-ink px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-exam-ink/90 sm:px-5 sm:py-2 sm:text-[14px]"
          >
            {questionLabel}
            <ChevronUpIcon
              className={`h-4 w-4 transition-transform ${navigatorOpen ? "rotate-180" : ""}`}
            />
          </button>
        )}

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {canBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-full bg-exam-blue px-4 py-1.5 text-[14px] font-semibold text-white hover:bg-exam-blue-600 sm:px-7 sm:py-2"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            className="rounded-full bg-exam-blue px-4 py-1.5 text-[14px] font-semibold text-white hover:bg-exam-blue-600 sm:px-7 sm:py-2"
          >
            {nextLabel}
          </button>
        </div>
      </footer>
    </div>
  );
}
