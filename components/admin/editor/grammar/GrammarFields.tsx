"use client";

import type { ChangeEvent } from "react";
import type { FieldEditorProps, GrammarContent, LetteredChoice } from "@/lib/drills/types";
import { label } from "@/components/drills/shared/ui";

const IDS: LetteredChoice["id"][] = ["A", "B", "C", "D"];

// Always work with a complete A-D set so the four inputs render even on a fresh
// question whose content has not been authored yet.
function normalize(content: GrammarContent | undefined): GrammarContent {
  const byId = new Map((content?.choices ?? []).map((c) => [c.id, c.text] as const));
  return {
    pattern: content?.pattern ?? "",
    choices: IDS.map((id) => ({ id, text: byId.get(id) ?? "" })),
    correct: content?.correct ?? "A",
  };
}

const inputClass =
  "w-full rounded-card border border-navy/20 bg-white px-3 py-2 text-sm text-navy placeholder:text-navy/35 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30";

// Edits ONLY the grammar-specific content (pattern, the four answer choices, and
// which choice is correct). The stem, passage, and explanation are owned by the
// shared shell and are intentionally not touched here.
export function Fields({ question, onChange }: FieldEditorProps) {
  const content = normalize(question.content as GrammarContent | undefined);

  function patch(next: Partial<GrammarContent>) {
    onChange({ content: { ...content, ...next } });
  }

  function setChoiceText(id: LetteredChoice["id"], text: string) {
    patch({ choices: content.choices.map((c) => (c.id === id ? { ...c, text } : c)) });
  }

  return (
    <div className="space-y-5">
      <div>
        <label className={`${label} mb-1.5 block text-navy/55`}>Grammar pattern</label>
        <input
          type="text"
          value={content.pattern ?? ""}
          onChange={(e: ChangeEvent<HTMLInputElement>) => patch({ pattern: e.target.value })}
          placeholder="Boundaries: joining two independent clauses"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-navy/45">The convention this item teaches. Drives mastery grouping.</p>
      </div>

      <fieldset className="space-y-2.5">
        <legend className={`${label} mb-1 text-navy/55`}>Answer choices · select the correct one</legend>
        {content.choices.map((c) => {
          const isCorrect = content.correct === c.id;
          return (
            <div
              key={c.id}
              className={`flex items-center gap-3 rounded-card border px-3 py-2.5 transition-colors ${
                isCorrect ? "border-success/50 bg-success-bg" : "border-navy/15 bg-white"
              }`}
            >
              <label className="flex flex-none cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name={`grammar-correct-${question.id}`}
                  checked={isCorrect}
                  onChange={() => patch({ correct: c.id })}
                  className="h-4 w-4 accent-success"
                />
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] font-display text-[13px] font-bold ${
                    isCorrect ? "border-success bg-success text-white" : "border-navy/25 bg-white text-navy"
                  }`}
                >
                  {c.id}
                </span>
              </label>
              <input
                type="text"
                value={c.text}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setChoiceText(c.id, e.target.value)}
                placeholder={`Choice ${c.id}`}
                className={inputClass}
              />
            </div>
          );
        })}
        <p className="text-xs text-navy/45">The selected choice is graded as correct. Use $...$ for any math.</p>
      </fieldset>
    </div>
  );
}
