"use client";

import type { PracticeTest } from "@/lib/sat/types";
import { Logo } from "@/components/Logo";

export function IntroScreen({
  test,
  onStart,
}: {
  test: PracticeTest;
  onStart: () => void;
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
          place — once you start a module, the timer runs continuously.
        </p>

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

        <button
          type="button"
          onClick={onStart}
          className="mt-8 w-full rounded-full bg-exam-blue py-3 text-sm font-semibold text-white hover:bg-exam-blue-600"
        >
          Begin Section 1
        </button>
        <p className="mt-4 text-xs text-exam-muted">
          The second module of each section adjusts in difficulty based on your
          first module — just like the real digital SAT.
        </p>
      </div>
    </main>
  );
}
