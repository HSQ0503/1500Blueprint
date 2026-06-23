"use client";

import { useState } from "react";
import Link from "next/link";
import type {
  AnswerMap,
  ChoiceId,
  ModuleVariant,
  PracticeTest,
  Question,
  SectionId,
} from "@/lib/sat/types";
import { isCorrect, type TestResult } from "@/lib/sat/scoring";
import { formatTime } from "@/lib/sat/testState";
import { Logo } from "@/components/Logo";
import { MathText } from "./MathText";
import { QuestionContent } from "./QuestionContent";
import { CheckIcon, CloseIcon } from "./icons";

type Props = {
  test: PracticeTest;
  result: TestResult;
  routed: Partial<Record<SectionId, ModuleVariant>>;
  answers: AnswerMap;
  perQuestionTime: Record<string, number>;
  // Taking mode (rendered by the client runner): retake the test.
  onRestart?: () => void;
  // Review mode (rendered server-side from a saved attempt): read-only links.
  backHref?: string;
  attemptDate?: string;
  // Taking mode, once the attempt has saved: link to its permanent report.
  savedHref?: string;
};

type ReviewItem = { sectionName: string; q: Question };

function answerText(q: Question, value: string | undefined): string {
  if (value == null || value === "") return "Omitted";
  if (q.type === "mc") {
    const choice = q.choices.find((c) => c.id === value);
    return choice ? `${choice.id}. ${choice.text}` : String(value);
  }
  return String(value);
}

function correctText(q: Question): string {
  if (q.type === "mc") {
    const choice = q.choices.find((c) => c.id === q.correct);
    return choice ? `${choice.id}. ${choice.text}` : q.correct;
  }
  return q.acceptedAnswers.join(" or ");
}

export function ResultsScreen({
  test,
  result,
  routed,
  answers,
  perQuestionTime,
  onRestart,
  backHref,
  attemptDate,
  savedHref,
}: Props) {
  const [showOnlyWrong, setShowOnlyWrong] = useState(false);

  const items: ReviewItem[] = test.sections.flatMap((section) => {
    const variant = routed[section.id] ?? "easy";
    const qs = [
      ...section.module1.questions,
      ...section.module2[variant].questions,
    ];
    return qs.map((q) => ({ sectionName: section.name, q }));
  });

  const visible = showOnlyWrong
    ? items.filter((it) => !isCorrect(it.q, answers[it.q.id]))
    : items;

  return (
    <main className="min-h-dvh bg-ice/40">
      {/* Score header (brand) */}
      <section className="bg-navy text-white">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
          <div className="flex items-center justify-between">
            <Logo className="text-white [&_.text-navy]:text-white" />
            <Link href="/" className="text-sm text-white/70 hover:text-white">
              Home
            </Link>
          </div>
          <div className="flex flex-col items-center text-center">
            <p className="text-sm uppercase tracking-wide text-sky">Total score</p>
            <p className="font-display text-6xl font-extrabold">{result.total}</p>
            <p className="text-sm text-white/60">out of 1600</p>
            {attemptDate && <p className="mt-1 text-xs text-white/50">Taken {attemptDate}</p>}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {result.sections.map((s) => {
              const section = test.sections.find((x) => x.id === s.sectionId);
              return (
                <div
                  key={s.sectionId}
                  className="rounded-2xl bg-white/10 p-5 ring-1 ring-inset ring-white/15"
                >
                  <p className="text-sm text-white/70">{section?.name}</p>
                  <p className="font-display text-3xl font-bold">{s.scaled}</p>
                  <p className="mt-1 text-xs text-white/60">
                    {s.raw}/{s.total} correct · routed to the{" "}
                    <span className="font-semibold text-sky">{s.variant}</span>{" "}
                    second module
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Domain breakdown */}
        <h2 className="font-display text-xl font-bold text-navy">
          Performance by skill area
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {result.domains.map((d) => {
            const pct = d.total ? Math.round((d.correct / d.total) * 100) : 0;
            return (
              <div
                key={d.domain}
                className="rounded-xl border border-ice-200 bg-white p-4"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">{d.domain}</span>
                  <span className="text-exam-muted">
                    {d.correct}/{d.total}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ice-200">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Per-question review */}
        <div className="mt-10 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-navy">
            Review your answers
          </h2>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={showOnlyWrong}
              onChange={(e) => setShowOnlyWrong(e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            Only incorrect
          </label>
        </div>

        <ol className="mt-4 space-y-4">
          {visible.map((it) => {
            const q = it.q;
            const userValue = answers[q.id] as string | undefined;
            const correct = isCorrect(q, userValue);
            const time = perQuestionTime[q.id] ?? 0;
            const wrongChoiceExplanation =
              q.type === "mc" &&
              userValue &&
              userValue !== q.correct &&
              q.choiceExplanations?.[userValue as ChoiceId];

            return (
              <li
                key={q.id}
                className="rounded-2xl border border-ice-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-exam-muted">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${
                      correct
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {correct ? (
                      <CheckIcon className="h-3.5 w-3.5" />
                    ) : (
                      <CloseIcon className="h-3.5 w-3.5" />
                    )}
                    {correct ? "Correct" : "Incorrect"}
                  </span>
                  <span>{it.sectionName}</span>
                  <span>·</span>
                  <span>{q.domain}</span>
                  <span>·</span>
                  <span className="capitalize">{q.difficulty}</span>
                  <span>·</span>
                  <span>{formatTime(time)} spent</span>
                </div>

                {q.passage && (
                  <QuestionContent
                    text={q.passage}
                    pClassName="mt-3 whitespace-pre-line border-l-2 border-ice-200 pl-3 text-sm leading-6 text-exam-muted"
                  />
                )}
                <p className="mt-3 text-[15px] font-medium leading-7 text-ink">
                  <MathText>{q.prompt}</MathText>
                </p>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      correct
                        ? "bg-green-50 text-green-800"
                        : "bg-red-50 text-red-800"
                    }`}
                  >
                    <span className="block text-xs uppercase tracking-wide opacity-70">
                      Your answer
                    </span>
                    {answerText(q, userValue)}
                  </div>
                  <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
                    <span className="block text-xs uppercase tracking-wide opacity-70">
                      Correct answer
                    </span>
                    {correctText(q)}
                  </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-ink">
                  <span className="font-semibold">Why: </span>
                  <MathText>{q.explanation}</MathText>
                </p>
                {wrongChoiceExplanation && (
                  <p className="mt-1 text-sm leading-6 text-red-700">
                    <span className="font-semibold">Your choice: </span>
                    <MathText>{wrongChoiceExplanation}</MathText>
                  </p>
                )}
              </li>
            );
          })}
        </ol>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {onRestart && (
            <button
              type="button"
              onClick={onRestart}
              className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Retake practice test
            </button>
          )}
          {savedHref && (
            <Link
              href={savedHref}
              className="rounded-full border border-ink/20 px-6 py-2.5 text-sm font-semibold text-ink hover:bg-ice"
            >
              View saved report
            </Link>
          )}
          {backHref && (
            <Link
              href={backHref}
              className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Back to your attempts
            </Link>
          )}
          <Link
            href="/"
            className="rounded-full border border-ink/20 px-6 py-2.5 text-sm font-semibold text-ink hover:bg-ice"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
