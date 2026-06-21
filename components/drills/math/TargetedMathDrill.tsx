"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { DrillShell } from "../shared/DrillShell";
import { DigitalTimer, LivesHud } from "../shared/Hud";
import { chip, label, primaryBtn, secondaryBtn, surface } from "../shared/ui";
import { CalculatorIcon, CloseIcon, ReferenceIcon } from "@/components/test/icons";
import { MathText } from "@/components/test/MathText";
import { CalculatorPanel } from "@/components/test/CalculatorPanel";
import { TrophyIcon, XCircleIcon } from "../shared/icons";
import { DirectionsPanel } from "./DirectionsPanel";
import {
  REFERENCE_FORMULAS,
  SECONDS_PER_QUESTION,
  START_LIVES,
  WIN_TARGET,
  isCorrect,
  questionsFor,
  type MathDifficulty,
  type MathQuestion,
} from "./mockData";

type Phase = "playing" | "win" | "fail";
type Overlay = null | "calculator" | "reference";

export function TargetedMathDrill({
  difficulty = "medium",
  questions: provided,
}: {
  difficulty?: MathDifficulty;
  questions?: MathQuestion[];
}) {
  // Real DB questions when supplied; otherwise the offline mock for this difficulty.
  const questions = provided?.length ? provided : questionsFor(difficulty);
  // Only DB-backed questions have real ids to record; the offline mock isn't tracked.
  const tracked = Boolean(provided?.length);

  const [phase, setPhase] = useState<Phase>("playing");
  const [qIndex, setQIndex] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [seconds, setSeconds] = useState(SECONDS_PER_QUESTION);
  const [answer, setAnswer] = useState("");
  const [overlay, setOverlay] = useState<Overlay>(null);

  const question = questions[qIndex % questions.length];

  // Fire-and-forget: record this question as seen (and mastered when correct) so
  // it stops being re-fed and appears in History. Mock questions aren't tracked.
  function markSeen(questionId: string, wasCorrect: boolean) {
    if (!tracked) return;
    fetch("/api/drills/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drillSlug: "targeted-math", questionId, correct: wasCorrect }),
      keepalive: true,
    }).catch(() => {});
  }

  function advance() {
    setQIndex((i) => i + 1);
    setSeconds(SECONDS_PER_QUESTION);
    setAnswer("");
  }

  function loseLife() {
    markSeen(question.id, false);
    const nextLives = lives - 1;
    setAttempts((a) => a + 1);
    setLives(nextLives);
    if (nextLives <= 0) setPhase("fail");
    else advance();
  }

  function submit() {
    if (!answer.trim()) return;
    setAttempts((a) => a + 1);
    const ok = isCorrect(answer, question.accepted);
    markSeen(question.id, ok);
    if (ok) {
      const next = correct + 1;
      setCorrect(next);
      if (next >= WIN_TARGET) setPhase("win");
      else advance();
    } else {
      const nextLives = lives - 1;
      setLives(nextLives);
      if (nextLives <= 0) setPhase("fail");
      else advance();
    }
  }

  // Per-question countdown. Running out of time costs a life. The transition is
  // triggered inside the interval callback (not the effect body) to stay pure.
  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      if (seconds <= 1) loseLife();
      else setSeconds((s) => s - 1);
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, seconds]);

  function restart() {
    setPhase("playing");
    setQIndex(0);
    setLives(START_LIVES);
    setCorrect(0);
    setAttempts(0);
    setSeconds(SECONDS_PER_QUESTION);
    setAnswer("");
  }

  const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 100;

  if (phase !== "playing") {
    return (
      <DrillShell title="Targeted Math Practice" eyebrow="Math" exitHref="/drills">
        <ResultScreen won={phase === "win"} correct={correct} accuracy={accuracy} onRetry={restart} />
      </DrillShell>
    );
  }

  const center = (
    <div className="flex items-center gap-2 sm:gap-3">
      <LivesHud total={START_LIVES} remaining={Math.max(0, lives)} />
      <span className="whitespace-nowrap text-sm font-semibold tabular-nums text-navy">
        {correct} / {WIN_TARGET}
        <span className="ml-1 hidden font-normal text-navy/45 sm:inline">correct</span>
      </span>
      <DigitalTimer seconds={seconds} warning={seconds <= 10} />
    </div>
  );

  const right = (
    <div className="flex items-center gap-1.5">
      <ToolButton icon={<CalculatorIcon className="h-4 w-4" />} text="Calculator" onClick={() => setOverlay("calculator")} />
      <ToolButton icon={<ReferenceIcon className="h-4 w-4" />} text="Reference" onClick={() => setOverlay("reference")} />
    </div>
  );

  return (
    <DrillShell title="Targeted Math Practice" eyebrow="Math" exitHref="/drills" center={center} right={right}>
      <div className={`mx-auto max-w-5xl ${surface} p-5 sm:p-7`}>
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-0">
          <div className="lg:pr-8">
            <DirectionsPanel />
          </div>

          <div className="lg:border-l lg:border-navy/12 lg:pl-8">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-chip bg-navy text-sm font-bold text-white">
                {(qIndex % questions.length) + 1}
              </span>
              <span className={`${chip} bg-brand/10 text-brand-600`}>{difficulty}</span>
            </div>

            <p className="mt-4 font-serif text-[17px] leading-relaxed text-exam-ink">
              <MathText>{question.prompt}</MathText>
            </p>

            <label htmlFor="math-answer" className={`${label} mt-6 block text-navy/50`}>
              Enter your answer
            </label>
            <input
              id="math-answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              inputMode="text"
              autoComplete="off"
              placeholder="Type your answer"
              className="mt-2 w-44 rounded-card border border-navy/25 bg-white px-3 py-2 text-center font-serif text-lg tabular-nums text-exam-ink outline-none transition-colors placeholder:text-navy/30 focus:border-brand focus:ring-2 focus:ring-brand/20"
            />

            <div className="mt-4">
              <div className={`${label} text-navy/50`}>Answer preview</div>
              <div className="mt-1.5 min-h-[2.5rem] rounded-card border border-navy/15 bg-paper/50 px-3 py-2 font-serif text-base text-exam-ink">
                {answer.trim() ? answer : <span className="text-navy/35">No answer entered</span>}
              </div>
            </div>

            <button type="button" onClick={submit} disabled={!answer.trim()} className={`${primaryBtn} mt-5 w-full sm:w-auto`}>
              Submit answer
            </button>
          </div>
        </div>
      </div>

      {overlay === "reference" ? (
        <Modal title="Reference" onClose={() => setOverlay(null)}>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {REFERENCE_FORMULAS.map((f) => (
              <li key={f.label} className="rounded-card border border-navy/12 bg-paper/40 px-3 py-2">
                <div className="text-xs text-navy/50">{f.label}</div>
                <div className="mt-0.5 font-serif text-[15px] text-exam-ink">{f.formula}</div>
              </li>
            ))}
          </ul>
        </Modal>
      ) : null}

      {overlay === "calculator" ? <CalculatorPanel onClose={() => setOverlay(null)} /> : null}
    </DrillShell>
  );
}

function ToolButton({ icon, text, onClick }: { icon: ReactNode; text: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-card border border-navy/15 px-2.5 py-1.5 text-sm font-semibold text-navy/70 transition-colors hover:bg-navy/5 hover:text-navy"
    >
      {icon}
      <span className="hidden sm:inline">{text}</span>
    </button>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-navy/30 p-4" onClick={onClose}>
      <div className="animate-pop-in w-full max-w-lg rounded-card border border-navy/15 bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-navy/10 px-4 py-3">
          <h3 className={`${label} text-navy/60`}>{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-card p-1 text-navy/50 transition-colors hover:bg-navy/5 hover:text-navy">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function ResultScreen({ won, correct, accuracy, onRetry }: { won: boolean; correct: number; accuracy: number; onRetry: () => void }) {
  return (
    <div className={`animate-pop-in mx-auto mt-8 max-w-md overflow-hidden rounded-card border ${won ? "border-success/30" : "border-danger/30"}`}>
      <div className={`border-l-[3px] px-6 py-6 ${won ? "border-l-success bg-success-bg" : "border-l-danger bg-danger-bg"}`}>
        <div className="flex items-center gap-3">
          <span className={won ? "text-success-600" : "text-danger-600"}>
            {won ? <TrophyIcon className="h-6 w-6" /> : <XCircleIcon className="h-6 w-6" />}
          </span>
          <div>
            <div className={`${label} ${won ? "text-success-600" : "text-danger-600"}`}>
              {won ? "Challenge complete" : "Out of lives"}
            </div>
            <h2 className="font-display text-xl font-bold text-ink">
              {won ? "You reached 10 correct" : "Run ended"}
            </h2>
          </div>
        </div>
      </div>
      <div className="bg-white px-6 py-5">
        <div className="flex gap-8">
          <Stat value={String(correct)} unit="correct" />
          <Stat value={`${accuracy}%`} unit="accuracy" />
        </div>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onRetry} className={primaryBtn}>
            Try again
          </button>
          <Link href="/drills" className={secondaryBtn}>
            Back to drills
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, unit }: { value: string; unit: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-extrabold tabular-nums text-navy">{value}</div>
      <div className="text-xs text-navy/50">{unit}</div>
    </div>
  );
}
