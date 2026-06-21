"use client";

import { useState } from "react";
import { MicIcon, SendIcon } from "./icons";
import { useDictation } from "./useDictation";

// The free-text answer box shared by Grammar ("Explain your process") and
// Reading ("Your Summary"). The Speak button dictates into the textarea via the
// Web Speech API and falls back to typing where the browser has no support.
export function ExplainInput({
  label = "Explain your process",
  helper = "Walk through your reasoning in detail: what you checked first, the rule you applied, and why the other options are wrong.",
  placeholder = "Describe your process from start to end. Name the rule, then show how it rules each choice in or out.",
  submitLabel = "Submit for grading",
  onSubmit,
}: {
  label?: string;
  helper?: string;
  placeholder?: string;
  submitLabel?: string;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const { supported, recording, toggle } = useDictation(text, setText);
  const canSubmit = text.trim().length > 0;

  return (
    <div className="rounded-xl border border-navy/15 bg-white p-[18px]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-navy">{label}</div>
          <p className="mt-1 text-[12.5px] leading-snug text-navy/55">{helper}</p>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={!supported}
          aria-pressed={recording}
          title={supported ? "Dictate your answer" : "Voice input isn't supported in this browser"}
          className={`inline-flex flex-none items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            recording ? "border-danger/30 bg-danger/10 text-danger" : "border-navy/15 text-navy/60 hover:bg-navy/5"
          }`}
        >
          <span className="relative flex h-4 w-4 items-center justify-center">
            <MicIcon className="h-4 w-4" />
            {recording ? <span className="animate-ring-pulse absolute -right-1 -top-1 h-2 w-2 rounded-full bg-danger" /> : null}
          </span>
          {recording ? "Listening" : "Speak"}
        </button>
      </div>

      <label htmlFor="explain-text" className="sr-only">
        {label}
      </label>
      <textarea
        id="explain-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="mt-3 min-h-[120px] w-full resize-y rounded-[10px] border-[1.5px] border-navy/[0.18] p-[13px_15px] text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-navy/35 focus:border-brand focus:ring-2 focus:ring-brand/15"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-navy/45">
          {recording ? "Listening… tap Listening to stop." : "Press submit to get instant AI feedback"}
        </span>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => onSubmit(text)}
          className="inline-flex items-center gap-2 rounded-lg bg-navy px-5 py-[11px] text-sm font-bold text-white transition-colors hover:bg-navy-700 disabled:cursor-not-allowed disabled:bg-navy/25"
        >
          {submitLabel}
          <SendIcon className="h-[15px] w-[15px]" />
        </button>
      </div>
    </div>
  );
}
