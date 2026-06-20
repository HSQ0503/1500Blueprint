"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { ProcessFeedback } from "@/lib/drills/types";
import { ChevronDownIcon } from "@/components/test/icons";
import { CheckCircleIcon } from "./icons";
import { label, surface } from "./ui";

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={surface}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-bold text-navy transition-colors hover:bg-navy/5"
      >
        {title}
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-navy/45 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open ? (
        <div className="border-t border-navy/10 px-4 py-3.5 text-sm leading-relaxed text-navy/75">
          {children}
        </div>
      ) : null}
    </div>
  );
}

// The result detail below the score: collapsible Question + Your Explanation,
// the AI Feedback prose, and the numbered Steps You Missed (or a success note).
export function FeedbackPanel({
  feedback,
  question,
  explanation,
}: {
  feedback: ProcessFeedback;
  question: ReactNode;
  explanation: string;
}) {
  const perfect = feedback.stepsMissed.length === 0;
  return (
    <div className="stagger space-y-3">
      <Accordion title="Question">{question}</Accordion>
      <Accordion title="Your Explanation">
        {explanation.trim() ? (
          <p className="whitespace-pre-wrap">{explanation}</p>
        ) : (
          <span className="text-navy/40">No explanation submitted.</span>
        )}
      </Accordion>

      <div className={surface}>
        <div className="border-b border-navy/10 px-4 py-2.5">
          <h3 className={`${label} text-navy/50`}>AI Feedback</h3>
        </div>
        <p className="px-4 py-3.5 text-sm leading-relaxed text-navy/75">{feedback.feedback}</p>
      </div>

      <div className={`overflow-hidden rounded-card border ${perfect ? "border-success/30" : "border-danger/30"}`}>
        <div
          className={`border-l-[3px] px-4 py-3.5 ${
            perfect ? "border-l-success bg-success-bg" : "border-l-danger bg-danger-bg"
          }`}
        >
          <h3 className={`${label} ${perfect ? "text-success-600" : "text-danger-600"}`}>
            {perfect ? "Steps you nailed" : "Steps you missed"}
          </h3>
          {perfect ? (
            <p className="mt-2.5 inline-flex items-center gap-2 text-sm text-success-600">
              <CheckCircleIcon className="h-4 w-4 shrink-0" />
              You covered every step of the critical path.
            </p>
          ) : (
            <ol className="mt-2.5 space-y-2.5">
              {feedback.stepsMissed.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-danger-600">
                  <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-chip border border-danger/40 text-[11px] font-bold tabular-nums">
                    {i + 1}
                  </span>
                  <span className="leading-snug">{step}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
