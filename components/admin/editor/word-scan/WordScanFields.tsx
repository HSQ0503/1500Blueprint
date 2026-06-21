"use client";

import { useState } from "react";
import type { FieldEditorProps, LetteredChoice, WordScanContent } from "@/lib/drills/types";
import { label, labelMuted } from "@/components/drills/shared/ui";

// Field editor for the word-scan drill. Owns ONLY question.content:
//   mode    — the scanning challenge name (e.g. "Ceased", "Bad Mold")
//   verbs   — target first-words the student must flag (chip list)
//   choices — four long paragraph choices A–D (textareas)
//   correct — the set of choices that should be flagged (checkboxes)
// Stem / passage / explanation / metadata are owned by the shared shell.

const CHOICE_IDS: LetteredChoice["id"][] = ["A", "B", "C", "D"];

const inputCls =
  "w-full rounded-[10px] border-[1.5px] border-navy/[0.18] px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-navy/35 focus:border-brand focus:ring-2 focus:ring-brand/15";
const textareaCls =
  "min-h-[96px] w-full resize-y rounded-[10px] border-[1.5px] border-navy/[0.18] p-[11px_13px] font-serif text-sm leading-relaxed text-exam-ink outline-none transition-colors placeholder:text-navy/35 focus:border-brand focus:ring-2 focus:ring-brand/15";

// Normalize loosely-typed stored content into a complete, ordered shape so the
// editor is stable even on partial/legacy rows.
function asContent(content: FieldEditorProps["question"]["content"]): WordScanContent {
  const c = content as Partial<WordScanContent>;
  const byId = new Map((c.choices ?? []).map((ch) => [ch.id, ch.text]));
  return {
    mode: c.mode ?? "",
    verbs: c.verbs ?? [],
    choices: CHOICE_IDS.map((id) => ({ id, text: byId.get(id) ?? "" })),
    correct: (c.correct ?? []).filter((id) => CHOICE_IDS.includes(id)),
  };
}

export function Fields({ question, onChange }: FieldEditorProps) {
  const content = asContent(question.content);
  const [verbDraft, setVerbDraft] = useState("");

  function patch(next: Partial<WordScanContent>) {
    onChange({ content: { ...content, ...next } });
  }

  function addVerb() {
    const v = verbDraft.trim();
    if (!v) return;
    const exists = content.verbs.some((x) => x.toLowerCase() === v.toLowerCase());
    if (!exists) patch({ verbs: [...content.verbs, v] });
    setVerbDraft("");
  }

  function removeVerb(verb: string) {
    patch({ verbs: content.verbs.filter((v) => v !== verb) });
  }

  function setChoiceText(id: LetteredChoice["id"], text: string) {
    patch({ choices: content.choices.map((ch) => (ch.id === id ? { ...ch, text } : ch)) });
  }

  function toggleCorrect(id: LetteredChoice["id"]) {
    const next = content.correct.includes(id)
      ? content.correct.filter((x) => x !== id)
      : [...content.correct, id];
    patch({ correct: CHOICE_IDS.filter((cid) => next.includes(cid)) });
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="ws-mode" className={`${label} mb-1.5 block text-navy/55`}>
          Mode
        </label>
        <input
          id="ws-mode"
          value={content.mode}
          onChange={(e) => patch({ mode: e.target.value })}
          placeholder='e.g. "Ceased" or "Bad Mold"'
          className={inputCls}
        />
      </div>

      <div>
        <span className={`${label} mb-1.5 block text-navy/55`}>Target verbs</span>
        <p className={`${labelMuted} mb-2 normal-case tracking-normal`}>
          First words to flag. A choice is correct when its opening word matches one of these.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {content.verbs.map((verb) => (
            <span
              key={verb}
              className="inline-flex items-center gap-1.5 rounded-chip border border-navy/20 bg-navy/[0.04] py-1 pl-2.5 pr-1.5 text-sm font-medium text-navy"
            >
              {verb}
              <button
                type="button"
                onClick={() => removeVerb(verb)}
                aria-label={`Remove ${verb}`}
                className="flex h-4 w-4 items-center justify-center rounded-chip text-navy/45 transition-colors hover:bg-danger/10 hover:text-danger"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden="true">
                  <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ))}
          {content.verbs.length === 0 ? <span className={labelMuted}>No verbs yet</span> : null}
        </div>
        <div className="mt-2.5 flex gap-2">
          <input
            value={verbDraft}
            onChange={(e) => setVerbDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addVerb();
              }
            }}
            placeholder="Add a verb and press Enter"
            className={inputCls}
          />
          <button
            type="button"
            onClick={addVerb}
            disabled={verbDraft.trim().length === 0}
            className="inline-flex shrink-0 items-center rounded-[10px] border border-navy/20 bg-white px-4 text-sm font-semibold text-navy transition-colors hover:bg-navy/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>

      <div>
        <span className={`${label} mb-1.5 block text-navy/55`}>Choices</span>
        <p className={`${labelMuted} mb-2.5 normal-case tracking-normal`}>
          Check the box on each choice that should be flagged.
        </p>
        <div className="space-y-3">
          {content.choices.map((choice) => {
            const checked = content.correct.includes(choice.id);
            return (
              <div
                key={choice.id}
                className={`rounded-card border px-3.5 py-3 transition-colors ${
                  checked ? "border-success/40 bg-success-bg" : "border-navy/15 bg-white"
                }`}
              >
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCorrect(choice.id)}
                    className="h-4 w-4 accent-success"
                  />
                  <span className="text-[13px] font-bold text-navy">Choice {choice.id}</span>
                  {checked ? (
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-success-600">Flagged</span>
                  ) : null}
                </label>
                <textarea
                  value={choice.text}
                  onChange={(e) => setChoiceText(choice.id, e.target.value)}
                  placeholder={`Choice ${choice.id} paragraph…`}
                  className={`${textareaCls} mt-2.5`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
