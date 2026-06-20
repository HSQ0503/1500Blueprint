"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DrillShell } from "../shared/DrillShell";
import { DigitalTimer, StreakDots } from "../shared/Hud";
import { ExplainInput } from "../shared/ExplainInput";
import { GradingLoader } from "../shared/GradingLoader";
import { ScoreBanner } from "../shared/ScoreBanner";
import { chip, label, primaryBtn, secondaryBtn, surface } from "../shared/ui";
import { KeyPointsChecklist, ReadingCard, RecallHeading } from "./ReadingPieces";
import { readingPassage, readingProgress, recallFail, recallPass } from "./mock";

type Phase = "read" | "recall" | "grading" | "feedback";
type Variant = "pass" | "fail";

export function ReadingDrill() {
  const [phase, setPhase] = useState<Phase>("read");
  const [secondsLeft, setSecondsLeft] = useState(readingPassage.readSeconds);
  const [summary, setSummary] = useState("");
  const [variant, setVariant] = useState<Variant>("pass");

  const feedback = variant === "pass" ? recallPass : recallFail;
  const lowTime = secondsLeft <= 20;

  // Countdown only runs during the timed read. Hitting zero advances to recall,
  // the same as pressing "Done Reading".
  useEffect(() => {
    if (phase !== "read") return;
    const id = window.setInterval(() => {
      if (secondsLeft <= 1) setPhase("recall");
      else setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, secondsLeft]);

  function submitSummary(text: string) {
    setSummary(text);
    setPhase("grading");
    window.setTimeout(() => setPhase("feedback"), 1600);
  }

  function nextPassage() {
    setSummary("");
    setSecondsLeft(readingPassage.readSeconds);
    setPhase("read");
  }

  // Timer lives in the header center slot during the read; nowhere else.
  const center =
    phase === "read" ? <DigitalTimer seconds={secondsLeft} warning={lowTime} /> : null;

  const right = (
    <span className="hidden items-center gap-2.5 text-sm text-navy/55 sm:inline-flex">
      Streak
      <StreakDots streak={readingProgress.streak} target={readingProgress.streakTarget} />
      <span className="tabular-nums text-navy/40">
        {readingProgress.streak}/{readingProgress.streakTarget}
      </span>
    </span>
  );

  return (
    <DrillShell
      title="Reading Comprehension Drill"
      eyebrow="Reading & Writing"
      exitHref="/drills"
      exitLabel="Exit Drill"
      center={center}
      right={right}
    >
      <PreviewSwitch variant={variant} onChange={setVariant} />

      {/* Progression rule bar — Level pill + streak target, shown while practicing. */}
      {phase === "read" || phase === "recall" ? (
        <div className={`mx-auto mb-5 max-w-3xl ${surface} flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5`}>
          <span className={`${chip} bg-brand/10 text-brand`}>Level {readingProgress.level}</span>
          <span className="h-4 w-px bg-navy/12" />
          <span className="text-sm text-navy/65">
            Your current streak is {readingProgress.streak}. Get {readingProgress.streakTarget} in a
            row to advance to level {readingProgress.level + 1}.
          </span>
        </div>
      ) : null}

      {phase === "read" ? (
        <>
          <PhaseNote
            kicker="Phase 1 — Timed Reading"
            text="Read closely. The passage disappears when the timer ends or you finish."
          />
          <ReadingCard passage={readingPassage} onDone={() => setPhase("recall")} />
        </>
      ) : null}

      {phase === "recall" ? (
        <div className="mx-auto max-w-3xl space-y-4">
          <PhaseNote
            kicker="Phase 2 — Recall"
            text="From memory only. Capture the main idea and every supporting detail you can."
          />
          <RecallHeading />
          <ExplainInput
            label="Your Summary"
            placeholder="Write everything you remember about the passage. Capture all the key points, findings, and arguments..."
            submitLabel="Submit"
            onSubmit={submitSummary}
          />
        </div>
      ) : null}

      {phase === "grading" ? (
        <GradingLoader
          title="Grading your recall..."
          subtitle="Comparing your summary against the passage's key points."
        />
      ) : null}

      {phase === "feedback" ? (
        <div className="mx-auto max-w-3xl space-y-4">
          <ScoreBanner score={feedback.score} verdict={feedback.verdict} />
          <KeyPointsChecklist points={feedback.keyPoints} />
          <SummaryRecap summary={summary} />
          <div className="flex flex-wrap gap-3 pt-1">
            <button type="button" onClick={nextPassage} className={primaryBtn}>
              Next passage
            </button>
            <Link href="/drills" className={secondaryBtn}>
              Back to drills
            </Link>
          </div>
        </div>
      ) : null}
    </DrillShell>
  );
}

// Small uppercase phase marker above each phase's content.
function PhaseNote({ kicker, text }: { kicker: string; text: string }) {
  return (
    <div className="mx-auto mb-4 max-w-3xl">
      <div className={`${label} text-navy/45`}>{kicker}</div>
      <p className="mt-1 text-sm text-navy/60">{text}</p>
    </div>
  );
}

// Read-back of what the student submitted, shown under the graded result.
function SummaryRecap({ summary }: { summary: string }) {
  return (
    <div className={surface}>
      <div className="border-b border-navy/10 px-4 py-2.5">
        <h3 className={`${label} text-navy/50`}>Your summary</h3>
      </div>
      {summary.trim() ? (
        <p className="whitespace-pre-wrap px-4 py-3.5 font-serif text-[15px] leading-relaxed text-exam-ink">
          {summary}
        </p>
      ) : (
        <p className="px-4 py-3.5 text-sm text-navy/40">No summary submitted.</p>
      )}
    </div>
  );
}

// Temporary preview control (UI-first only): flips the mock grading between a
// strong recall and a weak one so both feedback states can be polished. Removed
// when the real AI grading is wired up.
function PreviewSwitch({
  variant,
  onChange,
}: {
  variant: Variant;
  onChange: (v: Variant) => void;
}) {
  const options: { id: Variant; label: string }[] = [
    { id: "fail", label: "Low" },
    { id: "pass", label: "High" },
  ];
  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-1 rounded-card border border-navy/20 bg-white/95 px-1.5 py-1 text-xs font-semibold shadow-sm backdrop-blur">
      <span className="px-2 text-navy/45">Preview</span>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`rounded-chip px-2.5 py-1 transition-colors ${
            variant === o.id ? "bg-navy text-white" : "text-navy/60 hover:bg-navy/5"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
