"use client";

import type { AnswerMap, TestModule } from "@/lib/sat/types";
import { BookmarkFilledIcon } from "./icons";

type Props = {
  title: string;
  module: TestModule;
  answers: AnswerMap;
  marked: Record<string, boolean>;
  onGoto: (index: number) => void;
};

export function ReviewPage({ title, module, answers, marked, onGoto }: Props) {
  return (
    <main className="flex-1 overflow-y-auto bg-exam-bg font-exam-sans">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-center text-[34px] font-semibold text-exam-ink">
          Check Your Work
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-center text-[15px] leading-7 text-exam-ink">
          On test day, you won&rsquo;t be able to move on to the next module until
          time expires.
        </p>
        <p className="mx-auto mt-1 max-w-xl text-center text-[15px] leading-7 text-exam-ink">
          For these practice questions, you can click <strong>Next</strong> when
          you&rsquo;re ready to move on.
        </p>

        <div className="mt-8 rounded-xl border border-exam-border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[17px] font-bold text-exam-ink">{title}</h2>
            <div className="flex items-center gap-6 text-[14px] text-exam-ink">
              <span className="flex items-center gap-1.5">
                <span className="h-4 w-4 rounded-sm border border-dashed border-exam-ink" />
                Unanswered
              </span>
              <span className="flex items-center gap-1.5">
                <BookmarkFilledIcon className="h-4 w-4 text-exam-maroon" />
                For Review
              </span>
            </div>
          </div>

          <div className="my-4 border-t border-exam-border" />

          <ul className="grid grid-cols-8 gap-x-4 gap-y-5 sm:grid-cols-12">
            {module.questions.map((q, i) => {
              const isAnswered =
                answers[q.id] != null && String(answers[q.id]).trim() !== "";
              const isMarked = Boolean(marked[q.id]);
              return (
                <li key={q.id} className="relative flex justify-center">
                  {isMarked && (
                    <BookmarkFilledIcon className="absolute -right-1 -top-2 z-10 h-4 w-4 text-exam-maroon" />
                  )}
                  <button
                    type="button"
                    onClick={() => onGoto(i)}
                    className={`flex h-9 w-9 items-center justify-center rounded text-[15px] font-bold text-exam-blue ${
                      isAnswered
                        ? "border border-exam-blue/70"
                        : "border border-dashed border-exam-ink/60"
                    }`}
                  >
                    {i + 1}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </main>
  );
}
