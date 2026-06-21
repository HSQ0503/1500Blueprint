"use client";

import { useState } from "react";
import type { FieldEditorProps, FlashcardContent } from "@/lib/drills/types";
import { label, surface } from "@/components/drills/shared/ui";

// Narrows the loosely-typed question.content into a FlashcardContent with safe
// defaults so a freshly created (empty) question still renders editable fields.
function asContent(content: unknown): FlashcardContent {
  const c = (content ?? {}) as Partial<FlashcardContent>;
  return {
    word: c.word ?? "",
    pos: c.pos ?? "",
    definition: c.definition ?? "",
    example: c.example ?? "",
  };
}

const inputCls =
  "w-full rounded-card border border-navy/20 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-navy/35 focus:border-navy/45";

export function Fields({ question, onChange }: FieldEditorProps) {
  const content = asContent(question.content);

  function set(patch: Partial<FlashcardContent>) {
    onChange({ content: { ...content, ...patch } });
  }

  return (
    <div className="space-y-4">
      <Field label="Word">
        <input
          className={inputCls}
          value={content.word}
          onChange={(e) => set({ word: e.target.value })}
          placeholder="e.g. ephemeral"
        />
      </Field>

      <Field label="Part of speech">
        <input
          className={inputCls}
          value={content.pos}
          onChange={(e) => set({ pos: e.target.value })}
          placeholder="e.g. adj."
        />
      </Field>

      <Field label="Definition">
        <textarea
          className={`${inputCls} min-h-[4.5rem] resize-y`}
          value={content.definition}
          onChange={(e) => set({ definition: e.target.value })}
          placeholder="lasting for a very short time"
        />
      </Field>

      <Field label="Example sentence">
        <textarea
          className={`${inputCls} min-h-[4.5rem] resize-y`}
          value={content.example}
          onChange={(e) => set({ example: e.target.value })}
          placeholder="Fame can be ephemeral, fading almost as quickly as it arrives."
        />
      </Field>
    </div>
  );
}

function Field({ label: text, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={`${label} text-navy/55`}>{text}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

// Student-faithful preview: a flashcard front (word) with a click-to-reveal back
// (definition + example), mirroring ReviewCard in the student FlashcardsDrill.
export function Preview({ question }: { question: { content: FlashcardContent | unknown } }) {
  const content = asContent(question.content);
  const [revealed, setRevealed] = useState(false);

  return (
    <div className={`${surface} p-6`}>
      <button
        type="button"
        onClick={revealed ? undefined : () => setRevealed(true)}
        className={`flex min-h-[15rem] w-full flex-col items-center justify-center rounded-card border border-navy/15 bg-white px-6 py-10 text-center transition-colors ${
          revealed ? "cursor-default" : "cursor-pointer hover:border-navy/30"
        }`}
      >
        <div className={`${label} text-navy/40`}>Term</div>
        <div className="mt-2 font-serif text-4xl font-bold text-exam-ink">
          {content.word || <span className="text-navy/25">word</span>}
        </div>
        {revealed ? (
          <div className="animate-fade-in mt-5 w-full max-w-md border-t border-navy/10 pt-5">
            <div className="font-serif text-[15px] text-exam-ink">
              {content.pos ? <span className="italic text-navy/50">{content.pos}</span> : null}{" "}
              {content.definition || <span className="text-navy/25">definition</span>}
            </div>
            <p className="mt-3 font-serif text-sm italic leading-relaxed text-navy/55">
              {content.example || <span className="not-italic text-navy/25">example sentence</span>}
            </p>
          </div>
        ) : (
          <div className="mt-3 text-sm text-navy/40">Click to reveal the definition</div>
        )}
      </button>
    </div>
  );
}
