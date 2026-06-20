"use client";

import { useEffect, useRef, useState } from "react";
import { DrillShell } from "../shared/DrillShell";
import { ProgressBar, formatClock } from "../shared/Hud";
import { TrophyIcon, FlameIcon } from "../shared/icons";
import {
  BookmarkIcon,
  BookmarkFilledIcon,
  ClockIcon,
  CloseIcon,
} from "@/components/test/icons";
import { vocabItems } from "./mock";
import { VocabQuestion } from "./VocabQuestion";
import { VocabSummary } from "./VocabSummary";

const ADVANCE_DELAY = 850;

export function VocabDrill() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [mastered, setMastered] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);

  const advanceRef = useRef<number | null>(null);
  const total = vocabItems.length;
  const item = vocabItems[index];

  // Count-up timer: runs while the session is active.
  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [done]);

  useEffect(() => {
    return () => {
      if (advanceRef.current !== null) window.clearTimeout(advanceRef.current);
    };
  }, []);

  function handleSelect(word: string) {
    if (selected !== null) return;
    setSelected(word);

    const correct = word === item.correct;
    if (correct) {
      setMastered((m) => m + 1);
      setStreak((prev) => {
        const next = prev + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
    }

    advanceRef.current = window.setTimeout(() => {
      if (index + 1 >= total) {
        setDone(true);
      } else {
        setIndex((i) => i + 1);
        setSelected(null);
      }
    }, ADVANCE_DELAY);
  }

  function toggleSave(word: string) {
    setSaved((prev) => ({ ...prev, [word]: !prev[word] }));
  }

  function restart() {
    if (advanceRef.current !== null) window.clearTimeout(advanceRef.current);
    setIndex(0);
    setSelected(null);
    setMastered(0);
    setStreak(0);
    setBestStreak(0);
    setSeconds(0);
    setSaved({});
    setDone(false);
  }

  const answered = done ? total : selected !== null ? index + 1 : index;
  const savedCount = Object.values(saved).filter(Boolean).length;

  if (done) {
    return (
      <DrillShell
        title="Vocab Drill"
        eyebrow="Vocabulary"
        exitHref="/drills"
        right={<ExitButton href="/drills" />}
      >
        <VocabSummary
          total={total}
          mastered={mastered}
          bestStreak={bestStreak}
          seconds={seconds}
          savedCount={savedCount}
          onPracticeAgain={restart}
        />
      </DrillShell>
    );
  }

  const center = (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium tabular-nums text-navy/65">
      <ClockIcon className="h-4 w-4 text-navy/45" />
      Time: {formatClock(seconds)}
    </span>
  );

  return (
    <DrillShell
      title="Vocab Drill"
      eyebrow="Vocabulary"
      exitHref="/drills"
      center={center}
      right={<ExitButton href="/drills" />}
    >
      <div className="-mt-2 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-navy">
            Question {index + 1} of {total}
          </span>
        </div>
        <div className="mt-2.5">
          <ProgressBar value={answered} max={total} />
        </div>
        <div className="mt-3 flex items-center gap-5 border-t border-navy/10 pt-3">
          <span className="inline-flex items-center gap-1.5 text-sm text-navy/70">
            <TrophyIcon className="h-4 w-4 text-gold-600" />
            Words Mastered: <span className="font-semibold text-navy">{mastered}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm text-navy/70">
            <FlameIcon className="h-4 w-4 text-flag" />
            Streak: <span className="font-semibold text-navy">{streak}</span>
          </span>
        </div>
      </div>

      <VocabQuestion
        item={item}
        selected={selected}
        saved={saved}
        onSelect={handleSelect}
        onToggleSave={toggleSave}
      />
    </DrillShell>
  );
}

// Bookmark + close cluster mirroring the reference top-right controls. The
// bookmark saves the whole set for later; close exits to the drills index.
function ExitButton({ href }: { href: string }) {
  const [setSaved, setSetSaved] = useState(false);
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setSetSaved((v) => !v)}
        aria-pressed={setSaved}
        aria-label={setSaved ? "Remove drill from saved" : "Save drill"}
        title={setSaved ? "Saved" : "Save this drill"}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-card border transition-colors ${
          setSaved
            ? "border-gold/60 bg-gold/10 text-gold-600"
            : "border-navy/15 text-navy/55 hover:bg-navy/5 hover:text-navy"
        }`}
      >
        {setSaved ? (
          <BookmarkFilledIcon className="h-5 w-5" />
        ) : (
          <BookmarkIcon className="h-5 w-5" />
        )}
      </button>
      <a
        href={href}
        aria-label="Exit drill"
        title="Exit"
        className="inline-flex h-9 w-9 items-center justify-center rounded-card border border-navy/15 text-navy/55 transition-colors hover:bg-navy/5 hover:text-navy"
      >
        <CloseIcon className="h-5 w-5" />
      </a>
    </div>
  );
}
