"use client";

import type { AnswerMap, TestModule } from "@/lib/sat/types";
import { BookmarkFilledIcon, PinIcon } from "./icons";

type Props = {
  title: string;
  module: TestModule;
  currentIndex: number;
  answers: AnswerMap;
  marked: Record<string, boolean>;
  onGoto: (index: number) => void;
  onGotoReview: () => void;
  onClose: () => void;
};

export function QuestionNavigator({
  title,
  module,
  currentIndex,
  answers,
  marked,
  onGoto,
  onGotoReview,
  onClose,
}: Props) {
  return (
    <>
      <button
        type="button"
        aria-label="Close navigator"
        onClick={onClose}
        className="fixed inset-0 z-30 cursor-default"
      />
      <div className="fixed bottom-20 left-1/2 z-40 w-[min(40rem,94vw)] -translate-x-1/2 font-exam-sans">
        <div className="rounded-xl border border-exam-border bg-white p-4 shadow-2xl sm:p-6">
          <div className="flex items-start justify-between">
            <h2 className="mx-auto text-center text-[20px] font-bold text-exam-ink">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-exam-muted hover:text-exam-ink"
            >
              ✕
            </button>
          </div>

          <div className="my-3 border-y border-exam-border py-2">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[14px] text-exam-ink">
              <span className="flex items-center gap-1.5">
                <PinIcon className="h-4 w-4 text-exam-ink" /> Current
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-4 w-4 rounded-sm border border-exam-blue bg-exam-blue" /> Answered
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-4 w-4 rounded-sm border border-dashed border-exam-ink" /> Unanswered
              </span>
              <span className="flex items-center gap-1.5">
                <BookmarkFilledIcon className="h-4 w-4 text-exam-maroon" /> For Review
              </span>
            </div>
          </div>

          <ul className="grid grid-cols-6 gap-x-2 gap-y-4 pt-3 sm:grid-cols-8 sm:gap-x-3 sm:gap-y-5 md:grid-cols-10">
            {module.questions.map((q, i) => {
              const isCurrent = i === currentIndex;
              const isAnswered =
                answers[q.id] != null && String(answers[q.id]).trim() !== "";
              const isMarked = Boolean(marked[q.id]);
              return (
                <li key={q.id} className="relative flex justify-center">
                  {isCurrent && (
                    <PinIcon className="absolute -top-4 left-1/2 h-4 w-4 -translate-x-1/2 text-exam-ink" />
                  )}
                  {isMarked && (
                    <BookmarkFilledIcon className="absolute -right-1 -top-2 z-10 h-4 w-4 text-exam-maroon" />
                  )}
                  <button
                    type="button"
                    onClick={() => onGoto(i)}
                    aria-label={`Question ${i + 1}${isAnswered ? ", answered" : ", unanswered"}`}
                    className={`flex h-9 w-9 items-center justify-center rounded text-[15px] font-bold ${
                      isAnswered
                        ? "border border-exam-blue bg-exam-blue text-white"
                        : isCurrent
                          ? "border border-exam-blue text-exam-blue"
                          : "border border-dashed border-exam-ink/60 text-exam-blue"
                    }`}
                  >
                    {i + 1}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={onGotoReview}
              className="rounded-full border border-exam-blue px-6 py-1.5 text-[14px] font-semibold text-exam-blue hover:bg-exam-tint"
            >
              Go to Review Page
            </button>
          </div>
        </div>
        {/* downward tail */}
        <div className="mx-auto -mt-2 h-4 w-4 rotate-45 border-b border-r border-exam-border bg-white" />
      </div>
    </>
  );
}
