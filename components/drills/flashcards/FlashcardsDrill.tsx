"use client";

import { useState } from "react";
import Link from "next/link";
import { DrillShell } from "../shared/DrillShell";
import { ProgressBar } from "../shared/Hud";
import { label, primaryBtn, secondaryBtn, surface } from "../shared/ui";
import { SlidersIcon } from "../shared/icons";
import { DECK, DUE_COUNT, type Flashcard } from "./mock";

type Phase = "overview" | "review" | "summary";
type Rating = "again" | "good" | "easy";

export function FlashcardsDrill({ deck }: { deck?: Flashcard[] }) {
  const cards = deck?.length ? deck : DECK;
  const dueCount = deck?.length ? deck.length : DUE_COUNT;

  const [phase, setPhase] = useState<Phase>("overview");
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const card = cards[index];

  function start() {
    setPhase("review");
    setIndex(0);
    setRevealed(false);
    setReviewed(0);
  }

  function rate(rating: Rating) {
    void rating;
    const next = index + 1;
    setReviewed((n) => n + 1);
    if (next >= cards.length) {
      setPhase("summary");
    } else {
      setIndex(next);
      setRevealed(false);
    }
  }

  if (phase === "overview") {
    return (
      <DrillShell title="Vocab Flashcards" eyebrow="Vocabulary" exitHref="/drills">
        <Overview onStart={start} deckSize={cards.length} dueCount={dueCount} />
      </DrillShell>
    );
  }

  if (phase === "summary") {
    return (
      <DrillShell title="Vocab Flashcards" eyebrow="Vocabulary" exitHref="/drills">
        <div className={`animate-pop-in mx-auto mt-8 max-w-md ${surface} px-6 py-7 text-center`}>
          <div className={`${label} text-success-600`}>Review complete</div>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-ink">
            Reviewed {reviewed} cards
          </h2>
          <p className="mt-2 text-sm text-navy/55">
            Cards you found hard will come back sooner on your next review.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button type="button" onClick={start} className={primaryBtn}>
              Review again
            </button>
            <Link href="/drills" className={secondaryBtn}>
              Back to drills
            </Link>
          </div>
        </div>
      </DrillShell>
    );
  }

  const center = (
    <span className="text-sm font-semibold tabular-nums text-navy">
      {index + 1} <span className="font-normal text-navy/45">/ {cards.length}</span>
    </span>
  );

  return (
    <DrillShell title="Vocab Flashcards" eyebrow="Vocabulary" exitHref="/drills" center={center}>
      <div className="mx-auto max-w-2xl">
        <ProgressBar value={index} max={cards.length} />
        <ReviewCard card={card} revealed={revealed} onReveal={() => setRevealed(true)} onRate={rate} />
      </div>
    </DrillShell>
  );
}

function Overview({
  onStart,
  deckSize,
  dueCount,
}: {
  onStart: () => void;
  deckSize: number;
  dueCount: number;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className={`${surface} p-6`}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Stat value={String(deckSize)} unit="cards in deck" />
          <span className="hidden h-8 w-px bg-navy/12 sm:block" />
          <Stat value={String(dueCount)} unit="due for review" />
        </div>
      </div>

      <div className={`mt-4 ${surface}`}>
        <div className="border-b border-navy/10 px-5 py-3">
          <h3 className={`${label} text-navy/55`}>How it works</h3>
        </div>
        <ol className="space-y-3 px-5 py-4 text-sm text-navy/70">
          <Step n={1} text="See a word, then try to recall its meaning from memory." />
          <Step n={2} text="Reveal the definition and an example sentence to check yourself." />
          <Step n={3} text="Rate how well you knew it. Harder cards return sooner; easy ones wait longer." />
        </ol>
      </div>

      <div className="mt-5 flex gap-3">
        <button type="button" onClick={onStart} className={primaryBtn}>
          Start review
        </button>
        <button type="button" className={secondaryBtn}>
          <SlidersIcon className="h-4 w-4" />
          Manage deck
        </button>
      </div>
    </div>
  );
}

function ReviewCard({
  card,
  revealed,
  onReveal,
  onRate,
}: {
  card: Flashcard;
  revealed: boolean;
  onReveal: () => void;
  onRate: (r: Rating) => void;
}) {
  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={revealed ? undefined : onReveal}
        className={`flex min-h-[15rem] w-full flex-col items-center justify-center rounded-card border border-navy/15 bg-white px-6 py-10 text-center transition-colors ${
          revealed ? "cursor-default" : "cursor-pointer hover:border-navy/30"
        }`}
      >
        <div className={`${label} text-navy/40`}>Term</div>
        <div className="mt-2 font-serif text-4xl font-bold text-exam-ink">{card.word}</div>
        {revealed ? (
          <div className="animate-fade-in mt-5 w-full max-w-md border-t border-navy/10 pt-5">
            <div className="font-serif text-[15px] text-exam-ink">
              <span className="italic text-navy/50">{card.pos}</span> {card.definition}
            </div>
            <p className="mt-3 font-serif text-sm italic leading-relaxed text-navy/55">
              {card.example}
            </p>
          </div>
        ) : (
          <div className="mt-3 text-sm text-navy/40">Click to reveal the definition</div>
        )}
      </button>

      {revealed ? (
        <div className="animate-fade-in mt-4 grid grid-cols-3 gap-3">
          <RateButton tone="danger" labelText="Again" hint="soon" onClick={() => onRate("again")} />
          <RateButton tone="navy" labelText="Good" hint="later" onClick={() => onRate("good")} />
          <RateButton tone="success" labelText="Easy" hint="much later" onClick={() => onRate("easy")} />
        </div>
      ) : null}
    </div>
  );
}

function RateButton({
  tone,
  labelText,
  hint,
  onClick,
}: {
  tone: "danger" | "navy" | "success";
  labelText: string;
  hint: string;
  onClick: () => void;
}) {
  const tones: Record<typeof tone, string> = {
    danger: "border-danger/30 text-danger-600 hover:bg-danger-bg",
    navy: "border-navy/25 text-navy hover:bg-navy/5",
    success: "border-success/30 text-success-600 hover:bg-success-bg",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center rounded-card border bg-white px-3 py-2.5 text-sm font-semibold transition-colors ${tones[tone]}`}
    >
      {labelText}
      <span className="mt-0.5 text-[11px] font-normal text-navy/40">{hint}</span>
    </button>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-chip border border-navy/20 text-[11px] font-bold tabular-nums text-navy/60">
        {n}
      </span>
      <span className="leading-snug">{text}</span>
    </li>
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
