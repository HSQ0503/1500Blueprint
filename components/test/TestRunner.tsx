"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import type { PracticeTest } from "@/lib/sat/types";
import { activeModule, activeSection, initialState, makeReducer } from "@/lib/sat/testState";
import { scoreTest } from "@/lib/sat/scoring";
import type { Highlight } from "./HighlightablePassage";
import { IntroScreen } from "./IntroScreen";
import { TestHeader } from "./TestHeader";
import { PracticeBanner } from "./PracticeBanner";
import { QuestionScreen } from "./QuestionScreen";
import { FooterNav } from "./FooterNav";
import { QuestionNavigator } from "./QuestionNavigator";
import { ReviewPage } from "./ReviewPage";
import { ModuleOverScreen } from "./ModuleOverScreen";
import { DirectionsModal } from "./DirectionsModal";
import { ReferenceModal } from "./ReferenceModal";
import { CalculatorPanel } from "./CalculatorPanel";
import { LineReader } from "./LineReader";
import { BreakScreen } from "./BreakScreen";
import { ResultsScreen } from "./ResultsScreen";

const STUDENT_NAME = "Shouqi Han";

export function TestRunner({ test }: { test: PracticeTest }) {
  const router = useRouter();
  const reducer = useMemo(() => makeReducer(test), [test]);
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  const [overlay, setOverlay] = useState<null | "directions" | "reference">(null);
  const [calcOpen, setCalcOpen] = useState(false);
  const [lineReaderOn, setLineReaderOn] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [highlightOn, setHighlightOn] = useState(true);
  const [highlights, setHighlights] = useState<Record<string, Highlight[]>>({});

  useEffect(() => {
    if (state.phase !== "module" && state.phase !== "break") return;
    const id = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(id);
  }, [state.phase]);

  useEffect(() => {
    if (state.phase !== "moduleOver") return;
    const id = setTimeout(() => dispatch({ type: "ADVANCE" }), 2200);
    return () => clearTimeout(id);
  }, [state.phase]);

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

  if (state.phase === "intro") {
    return <IntroScreen test={test} onStart={() => dispatch({ type: "START" })} />;
  }
  if (state.phase === "moduleOver") {
    return <ModuleOverScreen />;
  }
  if (state.phase === "break") {
    return (
      <BreakScreen
        timeLeft={state.timeLeft}
        studentName={STUDENT_NAME}
        onResume={() => dispatch({ type: "END_BREAK" })}
      />
    );
  }
  if (state.phase === "results") {
    const result = scoreTest(test, state.routed, state.answers);
    return (
      <ResultsScreen
        test={test}
        result={result}
        routed={state.routed}
        answers={state.answers}
        perQuestionTime={state.perQuestionTime}
        onRestart={() => dispatch({ type: "RESTART" })}
      />
    );
  }

  const section = activeSection(test, state);
  const mod = activeModule(test, state);
  const question = mod.questions[state.qIndex];
  const moduleLabel = `Section ${state.sectionIndex + 1}, Module ${state.moduleOrder}: ${section.name}`;
  const isMath = section.id === "math";

  const header = (
    <TestHeader
      moduleLabel={moduleLabel}
      isMath={isMath}
      timeLeft={state.timeLeft}
      timerHidden={state.timerHidden}
      warning={state.timeLeft <= 300}
      highlightEnabled={highlightOn}
      onToggleTimer={() => dispatch({ type: "TOGGLE_TIMER" })}
      onToggleHighlights={() => setHighlightOn((o) => !o)}
      onOpenDirections={() => setOverlay("directions")}
      onOpenReference={() => setOverlay("reference")}
      onOpenCalculator={() => setCalcOpen(true)}
      onOpenLineReader={() => setLineReaderOn(true)}
      onExit={() => router.push("/")}
    />
  );

  const overlays = (
    <>
      {overlay === "directions" && (
        <DirectionsModal section={section} onClose={() => setOverlay(null)} />
      )}
      {overlay === "reference" && <ReferenceModal onClose={() => setOverlay(null)} />}
      {calcOpen && <CalculatorPanel onClose={() => setCalcOpen(false)} />}
      {lineReaderOn && <LineReader onClose={() => setLineReaderOn(false)} />}
    </>
  );

  if (state.phase === "review") {
    return (
      <div className="flex h-dvh flex-col bg-exam-bg text-exam-ink">
        {header}
        <PracticeBanner />
        <ReviewPage
          title={`${moduleLabel} Questions`}
          module={mod}
          answers={state.answers}
          marked={state.marked}
          onGoto={(i) => dispatch({ type: "GOTO", index: i })}
        />
        <FooterNav
          studentName={STUDENT_NAME}
          showCenter={false}
          canBack
          onBack={() => dispatch({ type: "GOTO", index: state.qIndex })}
          onNext={() => dispatch({ type: "SUBMIT_MODULE" })}
        />
        {overlays}
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="flex h-dvh flex-col bg-exam-bg text-exam-ink">
      {header}
      <PracticeBanner />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <QuestionScreen
          section={section}
          question={question}
          index={state.qIndex}
          answer={state.answers[question.id]}
          marked={Boolean(state.marked[question.id])}
          eliminated={state.eliminated[question.id] ?? []}
          eliminatorOn={state.eliminatorOn}
          highlightEnabled={highlightOn}
          highlights={highlights[question.id] ?? []}
          onSelect={(value) => dispatch({ type: "SELECT", questionId: question.id, value })}
          onToggleMark={() => dispatch({ type: "TOGGLE_MARK", questionId: question.id })}
          onToggleEliminate={(choice) =>
            dispatch({ type: "TOGGLE_ELIMINATE", questionId: question.id, choice })
          }
          onToggleEliminator={() =>
            dispatch({ type: "SET_ELIMINATOR", on: !state.eliminatorOn })
          }
          onAddHighlight={(h) => addHighlight(question.id, h)}
          onRemoveHighlight={(s, e) => removeHighlight(question.id, s, e)}
          onSetNote={(id, note) => setHighlightNote(question.id, id, note)}
          calcOpen={calcOpen}
        />

        {navOpen && (
          <QuestionNavigator
            title={`${moduleLabel} Questions`}
            module={mod}
            currentIndex={state.qIndex}
            answers={state.answers}
            marked={state.marked}
            onGoto={(i) => {
              dispatch({ type: "GOTO", index: i });
              setNavOpen(false);
            }}
            onGotoReview={() => {
              dispatch({ type: "OPEN_REVIEW" });
              setNavOpen(false);
            }}
            onClose={() => setNavOpen(false)}
          />
        )}
      </div>

      <FooterNav
        studentName={STUDENT_NAME}
        questionLabel={`Question ${state.qIndex + 1} of ${mod.questions.length}`}
        canBack={state.qIndex > 0}
        onBack={() => dispatch({ type: "BACK" })}
        onNext={() => dispatch({ type: "NEXT" })}
        onToggleNavigator={() => setNavOpen((o) => !o)}
        navigatorOpen={navOpen}
      />
      {overlays}
    </div>
  );
}
