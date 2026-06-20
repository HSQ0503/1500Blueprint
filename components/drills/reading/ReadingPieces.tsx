"use client";

import type { KeyPoint, ReadingPassage } from "./mock";
import { CheckIcon } from "@/components/test/icons";
import { label, surface } from "../shared/ui";

// --- Phase 1: timed reading ---------------------------------------------------

// The passage sits alone in a centered, generously set serif card so the read
// is calm and focused. A "Done Reading" button ends the read early.
export function ReadingCard({
  passage,
  onDone,
}: {
  passage: ReadingPassage;
  onDone: () => void;
}) {
  return (
    <div className="animate-fade-in mx-auto max-w-3xl">
      <article className={`${surface} px-6 py-8 sm:px-10 sm:py-11`}>
        <div className="space-y-5">
          {passage.body.map((para, i) => (
            <p key={i} className="font-serif text-[17px] leading-[1.85] text-exam-ink">
              {para}
            </p>
          ))}
        </div>
      </article>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={onDone}
          className="inline-flex items-center justify-center gap-2 rounded-card bg-navy px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
        >
          <CheckIcon className="h-4 w-4" />
          Done Reading
        </button>
      </div>
    </div>
  );
}

// --- Phase 2: recall heading --------------------------------------------------

// The prompt card above the summary box. Mirrors the reference copy and uses an
// open-book glyph in a squared brand tile.
export function RecallHeading() {
  return (
    <div className={`${surface} flex items-start gap-3.5 p-4 sm:p-5`}>
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-chip border border-brand/20 bg-brand/10 text-brand">
        <BookIcon className="h-5 w-5" />
      </span>
      <div>
        <h2 className="font-display text-lg font-bold text-ink">Summarize what you just read</h2>
        <p className="mt-0.5 text-sm leading-relaxed text-navy/55">
          The passage is gone. Write everything you remember.
        </p>
      </div>
    </div>
  );
}

// --- Phase 3 (feedback): key points checklist ---------------------------------

// The graded recall: each key point marked captured (success) or missed
// (danger), with a small captured-count header.
export function KeyPointsChecklist({ points }: { points: KeyPoint[] }) {
  const captured = points.filter((p) => p.captured).length;
  return (
    <div className={surface}>
      <div className="flex items-center justify-between gap-3 border-b border-navy/10 px-4 py-2.5">
        <h3 className={`${label} text-navy/50`}>Key points</h3>
        <span className="text-xs font-semibold tabular-nums text-navy/50">
          {captured}/{points.length} captured
        </span>
      </div>
      <ul className="divide-y divide-navy/8">
        {points.map((point, i) => (
          <li key={i} className="flex items-start gap-3 px-4 py-3">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-chip ${
                point.captured
                  ? "bg-success-bg text-success-600"
                  : "bg-danger-bg text-danger-600"
              }`}
            >
              {point.captured ? (
                <CheckIcon className="h-3.5 w-3.5" />
              ) : (
                <XMarkIcon className="h-3.5 w-3.5" />
              )}
            </span>
            <span
              className={`font-serif text-[15px] leading-snug ${
                point.captured ? "text-exam-ink" : "text-navy/55"
              }`}
            >
              {point.text}
            </span>
            <span
              className={`ml-auto shrink-0 pl-2 text-[11px] font-semibold uppercase tracking-wide ${
                point.captured ? "text-success-600" : "text-danger-600"
              }`}
            >
              {point.captured ? "Captured" : "Missed"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Local icons --------------------------------------------------------------

function BookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 6.5C10.5 5.2 8.3 4.8 5.5 5.2A1 1 0 0 0 4.7 6.2v11a1 1 0 0 0 1.1 1c2.6-.3 4.7 0 6.2 1.3 1.5-1.3 3.6-1.6 6.2-1.3a1 1 0 0 0 1.1-1v-11a1 1 0 0 0-.8-1C15.7 4.8 13.5 5.2 12 6.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12 6.5V19" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function XMarkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
