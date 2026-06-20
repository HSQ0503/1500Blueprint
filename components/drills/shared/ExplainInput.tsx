"use client";

import { useState } from "react";
import { MicIcon, SendIcon } from "./icons";
import { primaryBtn, surface } from "./ui";

// The free-text answer box shared by Grammar ("Explain Your Process") and
// Reading ("Your Summary"). The Speak button is a visual recording state for
// now; the logic phase wires it to dictation (Web Speech API).
export function ExplainInput({
  label = "Explain Your Process",
  placeholder = "Describe your process when solving this question from start to end. Be as detailed as possible.",
  submitLabel = "Submit",
  onSubmit,
}: {
  label?: string;
  placeholder?: string;
  submitLabel?: string;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const canSubmit = text.trim().length > 0;

  return (
    <div className={`${surface} p-4 sm:p-5`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-base font-bold text-ink">{label}</h3>
        <button
          type="button"
          onClick={() => setRecording((r) => !r)}
          aria-pressed={recording}
          className={`inline-flex items-center gap-1.5 rounded-card border px-3 py-1.5 text-sm font-semibold transition-colors ${
            recording
              ? "border-danger/30 bg-danger/10 text-danger"
              : "border-navy/20 text-navy/70 hover:bg-navy/5"
          }`}
        >
          <span className="relative flex h-4 w-4 items-center justify-center">
            <MicIcon className="h-4 w-4" />
            {recording ? (
              <span className="animate-ring-pulse absolute -right-1 -top-1 h-2 w-2 rounded-full bg-danger" />
            ) : null}
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
        rows={5}
        placeholder={placeholder}
        className="mt-3 w-full resize-none rounded-card border border-navy/20 bg-paper/40 p-3.5 text-[15px] leading-relaxed text-ink outline-none transition-colors placeholder:text-navy/35 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
      />

      <div className="mt-3 flex justify-end">
        <button type="button" disabled={!canSubmit} onClick={() => onSubmit(text)} className={primaryBtn}>
          <SendIcon className="h-4 w-4" />
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
