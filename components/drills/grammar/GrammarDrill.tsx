"use client";

import { useState } from "react";
import type { ChoiceId } from "@/lib/sat/types";
import type { GrammarQuestion } from "@/lib/drills/types";
import {
  grammarFailFeedback,
  grammarMastery,
  grammarPassFeedback,
  grammarQuestion,
} from "@/lib/drills/mock";
import { DrillShell } from "../shared/DrillShell";
import { StatPill, StreakDots } from "../shared/Hud";
import { ExplainInput } from "../shared/ExplainInput";
import { GradingLoader } from "../shared/GradingLoader";
import { ScoreBanner } from "../shared/ScoreBanner";
import { FeedbackPanel } from "../shared/FeedbackPanel";
import { GrammarQuestionView } from "./GrammarQuestion";
import { primaryBtn, secondaryBtn, surface } from "../shared/ui";
import { HelpIcon } from "@/components/test/icons";

type Phase = "question" | "grading" | "feedback";
type Variant = "pass" | "fail";

export function GrammarDrill() {
  const [phase, setPhase] = useState<Phase>("question");
  const [selected, setSelected] = useState<ChoiceId | null>(null);
  const [explanation, setExplanation] = useState("");
  const [variant, setVariant] = useState<Variant>("fail");

  const q = grammarQuestion;
  const feedback = variant === "pass" ? grammarPassFeedback : grammarFailFeedback;

  function submit(text: string) {
    setExplanation(text);
    setPhase("grading");
    window.setTimeout(() => setPhase("feedback"), 1600);
  }

  function nextQuestion() {
    setPhase("question");
    setSelected(null);
    setExplanation("");
  }

  const right = (
    <div className="flex items-center gap-4">
      <StatPill icon={<HelpIcon />}>
        {grammarMastery.mastered}/{grammarMastery.total} mastered
      </StatPill>
      <span className="hidden text-sm text-navy/50 sm:inline">Cycle {grammarMastery.cycle}</span>
    </div>
  );

  return (
    <DrillShell title="Grammar Drill" eyebrow="Reading & Writing" exitHref="/drills" right={right}>
      <PreviewSwitch variant={variant} onChange={setVariant} />

      {phase === "question" ? (
        <div className="mx-auto max-w-5xl">
          <div className={`${surface} p-5 sm:p-7`}>
            <GrammarQuestionView question={q} selected={selected} onSelect={setSelected} />
          </div>

          <div className={`mt-4 flex items-center justify-between ${surface} px-4 py-2.5`}>
            <span className="inline-flex items-center gap-2.5 text-sm font-medium text-navy/70">
              Mastery streak
              <StreakDots streak={grammarMastery.streak} target={grammarMastery.streakTarget} />
              <span className="text-navy/40">
                {grammarMastery.streak}/{grammarMastery.streakTarget}
              </span>
            </span>
            <span className="hidden text-xs text-navy/45 sm:inline">
              Score 100 to start your streak
            </span>
          </div>

          <div className="mt-4">
            <ExplainInput onSubmit={submit} />
          </div>
        </div>
      ) : null}

      {phase === "grading" ? <GradingLoader /> : null}

      {phase === "feedback" ? (
        <div className="mx-auto max-w-3xl space-y-4">
          <ScoreBanner score={feedback.score} verdict={feedback.verdict} />
          {feedback.score < 100 ? (
            <StreakResetNote target={grammarMastery.streakTarget} />
          ) : null}
          <FeedbackPanel
            feedback={feedback}
            explanation={explanation}
            question={<QuestionRecap q={q} />}
          />
          <div className="flex flex-wrap gap-3 pt-1">
            <button type="button" onClick={nextQuestion} className={primaryBtn}>
              Next question
            </button>
            <button type="button" onClick={() => setPhase("question")} className={secondaryBtn}>
              Back to question
            </button>
          </div>
        </div>
      ) : null}
    </DrillShell>
  );
}

function QuestionRecap({ q }: { q: GrammarQuestion }) {
  return (
    <div className="space-y-3">
      <p className="font-serif leading-relaxed text-exam-ink">{q.passage}</p>
      <p className="font-serif font-medium text-exam-ink">{q.prompt}</p>
      <ul className="space-y-1.5">
        {q.choices.map((c) => {
          const correct = c.id === q.correct;
          return (
            <li
              key={c.id}
              className={`flex items-center gap-2 ${
                correct ? "font-semibold text-success-600" : "text-navy/70"
              }`}
            >
              <span>{c.id}.</span>
              <span>{c.text}</span>
              {correct ? <span className="ml-1 text-xs">(correct)</span> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StreakResetNote({ target }: { target: number }) {
  return (
    <div className="animate-fade-in overflow-hidden rounded-card border border-danger/30">
      <div className="border-l-[3px] border-l-danger bg-danger-bg px-4 py-3.5">
        <div className="flex items-start gap-3">
          <RefreshIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-danger-600">
              Streak reset
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-danger">
              Because you scored below 100, your mastery streak for this pattern reset to 0. You will
              get a practice question next to help you learn this pattern.
            </p>
            <span className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-danger">
              <StreakDots streak={0} target={target} /> 0/{target} reset
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Temporary preview control (UI-first only): flips the mock feedback between a
// perfect run and a missed run so both states can be polished. Removed when the
// real AI grading is wired up.
function PreviewSwitch({
  variant,
  onChange,
}: {
  variant: Variant;
  onChange: (v: Variant) => void;
}) {
  const options: Variant[] = ["fail", "pass"];
  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-1 rounded-card border border-navy/20 bg-white/95 px-1.5 py-1 text-xs font-semibold shadow-sm backdrop-blur">
      <span className="px-2 text-navy/45">Preview</span>
      {options.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-chip px-2.5 py-1 capitalize transition-colors ${
            variant === v ? "bg-navy text-white" : "text-navy/60 hover:bg-navy/5"
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M20 11a8 8 0 1 0-.6 4M20 5v6h-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
