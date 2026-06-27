"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AnswerMap, AnswerValue, ChoiceId, Section, TestModule } from "@/lib/sat/types";
import type { PracticeModuleMeta } from "@/lib/sat/modules";
import type { Highlight } from "./HighlightablePassage";
import { TestHeader } from "./TestHeader";
import { PracticeBanner } from "./PracticeBanner";
import { QuestionScreen } from "./QuestionScreen";
import { FooterNav } from "./FooterNav";
import { QuestionNavigator } from "./QuestionNavigator";
import { ReviewPage } from "./ReviewPage";
import { DirectionsModal } from "./DirectionsModal";
import { ReferenceModal } from "./ReferenceModal";
import { CalculatorPanel } from "./CalculatorPanel";
import { LineReader } from "./LineReader";
import { ModuleResults } from "./ModuleResults";

const STUDENT_NAME = "Shouqi Han";

type Phase = "module" | "review" | "results";

// A focused, single-module practice runner. Reuses the full test's Bluebook UI
// but runs ONE module on a linear path (no adaptive routing, breaks, section 2,
// or scaled scoring) and ends on a raw score report. Independent from
// TestRunner, so the full-test flow is untouched.
export function ModuleRunner({
  slug,
  section,
  module,
  meta,
}: {
  slug: string;
  section: Section;
  module: TestModule;
  meta: PracticeModuleMeta;
}) {
  const router = useRouter();
  const totalSeconds = meta.minutes * 60;

  const [phase, setPhase] = useState<Phase>("module");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [eliminated, setEliminated] = useState<Record<string, ChoiceId[]>>({});
  const [eliminatorOn, setEliminatorOn] = useState(false);
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [timerHidden, setTimerHidden] = useState(false);
  const [perQuestionTime, setPerQuestionTime] = useState<Record<string, number>>({});
  const [highlights, setHighlights] = useState<Record<string, Highlight[]>>({});
  const [savedAttemptId, setSavedAttemptId] = useState<string | null>(null);

  const [overlay, setOverlay] = useState<null | "directions" | "reference">(null);
  const [calcOpen, setCalcOpen] = useState(false);
  const [lineReaderOn, setLineReaderOn] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [highlightOn, setHighlightOn] = useState(true);

  const qIndexRef = useRef(qIndex);
  useEffect(() => {
    qIndexRef.current = qIndex;
  }, [qIndex]);
  const completedRef = useRef(false);

  // Countdown while answering; time-up sends the student to the review page.
  useEffect(() => {
    if (phase !== "module") return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setPhase("review");
          return 0;
        }
        return t - 1;
      });
      const q = module.questions[qIndexRef.current];
      if (q) setPerQuestionTime((p) => ({ ...p, [q.id]: (p[q.id] ?? 0) + 1 }));
    }, 1000);
    return () => clearInterval(id);
  }, [phase, module]);

  // Save the attempt once, when the student reaches the results screen. The
  // server recomputes the score from the answers (the client can't inflate it).
  useEffect(() => {
    if (phase !== "results") {
      completedRef.current = false;
      return;
    }
    if (completedRef.current) return;
    completedRef.current = true;
    const clientToken = crypto.randomUUID();
    void fetch("/api/practice-test/module/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testSlug: slug, moduleKey: meta.key, answers, perQuestionTime, clientToken }),
      keepalive: true,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { attemptId?: string } | null) => {
        if (d?.attemptId) setSavedAttemptId(d.attemptId);
      })
      .catch(() => {});
  }, [phase, slug, meta.key, answers, perQuestionTime]);

  function restart() {
    setPhase("module");
    setQIndex(0);
    setAnswers({});
    setMarked({});
    setEliminated({});
    setEliminatorOn(false);
    setTimeLeft(totalSeconds);
    setPerQuestionTime({});
    setHighlights({});
    setNavOpen(false);
    setSavedAttemptId(null);
    completedRef.current = false;
  }

  function addHighlight(qid: string, h: Highlight) {
    setHighlights((prev) => ({ ...prev, [qid]: [...(prev[qid] ?? []), h] }));
  }
  function removeHighlight(qid: string, start: number, end: number) {
    setHighlights((prev) => ({
      ...prev,
      [qid]: (prev[qid] ?? []).filter((h) => !(h.start < end && h.end > start)),
    }));
  }
  function setHighlightNote(qid: string, id: string, note: string) {
    setHighlights((prev) => ({
      ...prev,
      [qid]: (prev[qid] ?? []).map((h) => (h.id === id ? { ...h, note } : h)),
    }));
  }

  if (module.questions.length === 0) {
    return (
      <div className="grid min-h-dvh place-items-center bg-exam-bg p-6 text-center text-exam-muted">
        This module has no questions yet.
      </div>
    );
  }

  if (phase === "results") {
    return (
      <ModuleResults
        meta={meta}
        module={module}
        answers={answers}
        perQuestionTime={perQuestionTime}
        timeUsedSeconds={totalSeconds - timeLeft}
        slug={slug}
        onRestart={restart}
        savedHref={
          savedAttemptId
            ? `/practice-test/${slug}/module/${meta.key}/results/${savedAttemptId}`
            : undefined
        }
      />
    );
  }

  const question = module.questions[qIndex];
  const moduleLabel = meta.fullLabel;
  const isMath = section.id === "math";

  const header = (
    <TestHeader
      moduleLabel={moduleLabel}
      isMath={isMath}
      timeLeft={timeLeft}
      timerHidden={timerHidden}
      warning={timeLeft <= 300}
      highlightEnabled={highlightOn}
      onToggleTimer={() => setTimerHidden((h) => !h)}
      onToggleHighlights={() => setHighlightOn((o) => !o)}
      onOpenDirections={() => setOverlay("directions")}
      onOpenReference={() => setOverlay("reference")}
      onOpenCalculator={() => setCalcOpen(true)}
      onOpenLineReader={() => setLineReaderOn(true)}
      onExit={() => router.push(`/practice-test/${slug}/modules`)}
    />
  );

  const overlays = (
    <>
      {overlay === "directions" && <DirectionsModal section={section} onClose={() => setOverlay(null)} />}
      {overlay === "reference" && <ReferenceModal onClose={() => setOverlay(null)} />}
      {calcOpen && <CalculatorPanel onClose={() => setCalcOpen(false)} />}
      {lineReaderOn && <LineReader onClose={() => setLineReaderOn(false)} />}
    </>
  );

  if (phase === "review") {
    return (
      <div className="flex h-dvh flex-col bg-exam-bg text-exam-ink">
        {header}
        <PracticeBanner />
        <ReviewPage
          title={`${moduleLabel} — Questions`}
          module={module}
          answers={answers}
          marked={marked}
          onGoto={(i) => {
            setQIndex(i);
            setPhase("module");
          }}
        />
        <FooterNav
          studentName={STUDENT_NAME}
          showCenter={false}
          canBack
          onBack={() => setPhase("module")}
          onNext={() => setPhase("results")}
        />
        {overlays}
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-exam-bg text-exam-ink">
      {header}
      <PracticeBanner />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <QuestionScreen
          section={section}
          question={question}
          index={qIndex}
          answer={answers[question.id]}
          marked={Boolean(marked[question.id])}
          eliminated={eliminated[question.id] ?? []}
          eliminatorOn={eliminatorOn}
          highlightEnabled={highlightOn}
          highlights={highlights[question.id] ?? []}
          onSelect={(value: AnswerValue) =>
            setAnswers((a) => ({ ...a, [question.id]: value }))
          }
          onToggleMark={() => setMarked((m) => ({ ...m, [question.id]: !m[question.id] }))}
          onToggleEliminate={(choice: ChoiceId) =>
            setEliminated((e) => {
              const cur = e[question.id] ?? [];
              const next = cur.includes(choice)
                ? cur.filter((c) => c !== choice)
                : [...cur, choice];
              return { ...e, [question.id]: next };
            })
          }
          onToggleEliminator={() => setEliminatorOn((on) => !on)}
          onAddHighlight={(h) => addHighlight(question.id, h)}
          onRemoveHighlight={(s, e) => removeHighlight(question.id, s, e)}
          onSetNote={(id, note) => setHighlightNote(question.id, id, note)}
          calcOpen={calcOpen}
        />

        {navOpen && (
          <QuestionNavigator
            title={`${moduleLabel} — Questions`}
            module={module}
            currentIndex={qIndex}
            answers={answers}
            marked={marked}
            onGoto={(i) => {
              setQIndex(i);
              setNavOpen(false);
            }}
            onGotoReview={() => {
              setPhase("review");
              setNavOpen(false);
            }}
            onClose={() => setNavOpen(false)}
          />
        )}
      </div>

      <FooterNav
        studentName={STUDENT_NAME}
        questionLabel={`Question ${qIndex + 1} of ${module.questions.length}`}
        canBack={qIndex > 0}
        onBack={() => setQIndex((i) => Math.max(0, i - 1))}
        onNext={() => {
          if (qIndex < module.questions.length - 1) setQIndex((i) => i + 1);
          else setPhase("review");
        }}
        onToggleNavigator={() => setNavOpen((o) => !o)}
        navigatorOpen={navOpen}
      />
      {overlays}
    </div>
  );
}
