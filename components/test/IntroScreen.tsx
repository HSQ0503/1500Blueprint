"use client";

import type { PracticeTest } from "@/lib/sat/types";
import { Logo } from "@/components/Logo";

export type ResumeInfo = { sectionLabel: string; timeLabel: string | null };

export function IntroScreen({
  test,
  onStart,
  resume,
  onResume,
  onStartOver,
}: {
  test: PracticeTest;
  onStart: () => void;
  resume?: ResumeInfo | null;
  onResume?: () => void;
  onStartOver?: () => void;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-exam-bg px-6 py-12">
      <div className="w-full max-w-md text-center">
        <Logo className="mx-auto mb-8" />
        <h1 className="font-display text-2xl font-bold text-exam-ink">
          {test.title}
        </h1>
        <p className="mt-3 text-[15px] leading-7 text-exam-muted">
          This is a full-length, Bluebook-style practice test. Work in a quiet
          place. Once you start a module, the timer runs continuously.
        </p>

        {resume && (
          <div className="mt-6 rounded-xl border border-exam-blue/30 bg-exam-tint px-4 py-4 text-left">
            <p className="text-sm font-semibold text-exam-ink">Resume where you left off</p>
            <p className="mt-1 text-[13px] leading-6 text-exam-muted">
              You stopped at {resume.sectionLabel}.
              {resume.timeLabel
                ? ` Your timer was paused at ${resume.timeLabel} when you left and will pick up from there.`
                : ""}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={onResume}
                className="flex-1 rounded-full bg-exam-blue py-2.5 text-sm font-semibold text-white hover:bg-exam-blue-600"
              >
                Resume test
              </button>
              <button
                type="button"
                onClick={onStartOver}
                className="rounded-full border border-exam-line px-4 py-2.5 text-sm font-semibold text-exam-ink hover:bg-exam-bg"
              >
                Start over
              </button>
            </div>
          </div>
        )}

        <dl className="mt-8 space-y-3 text-left">
          {test.sections.map((s, i) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-xl border border-exam-line px-4 py-3"
            >
              <dt className="text-sm font-semibold text-exam-ink">
                Section {i + 1}: {s.name}
              </dt>
              <dd className="text-sm text-exam-muted">
                2 modules · {s.minutesPerModule} min each
              </dd>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-xl border border-dashed border-exam-line px-4 py-3">
            <dt className="text-sm font-semibold text-exam-ink">Break</dt>
            <dd className="text-sm text-exam-muted">
              {test.breakMinutes} min between sections
            </dd>
          </div>
        </dl>

        {!resume && (
          <button
            type="button"
            onClick={onStart}
            className="mt-8 w-full rounded-full bg-exam-blue py-3 text-sm font-semibold text-white hover:bg-exam-blue-600"
          >
            Begin Section 1
          </button>
        )}
        <p className="mt-4 text-xs text-exam-muted">
          The second module of each section adjusts in difficulty based on your
          first module, just like the real digital SAT.
        </p>
      </div>
    </main>
  );
}
