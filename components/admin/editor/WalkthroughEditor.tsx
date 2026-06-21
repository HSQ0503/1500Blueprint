"use client";

import type { WalkthroughKind, WalkthroughStep } from "@/lib/drills/types";
import { label } from "@/components/drills/shared/ui";

// Editor for a question's critical path: the ordered ideal-solving steps the AI
// grades a student's explanation against. NORMAL = a reasoning step; CONFIRM
// OPTION = the step that locks in an answer choice (e.g. "select answer A").

export type WalkthroughEditorProps = {
  steps: WalkthroughStep[];
  onChange: (steps: WalkthroughStep[]) => void;
};

const KINDS: { value: WalkthroughKind; tag: string }[] = [
  { value: "normal", tag: "Normal" },
  { value: "confirm_option", tag: "Confirm Option" },
];

// Reorder rewrites positions to a clean 1..n so the DB never sees gaps.
function renumber(steps: WalkthroughStep[]): WalkthroughStep[] {
  return steps.map((step, i) => ({ ...step, position: i + 1 }));
}

const iconBtn =
  "flex h-7 w-7 items-center justify-center rounded-chip border border-navy/15 text-navy/55 transition-colors hover:bg-navy/5 disabled:cursor-not-allowed disabled:opacity-30";

export function WalkthroughEditor({ steps, onChange }: WalkthroughEditorProps) {
  const update = (id: string, patch: Partial<WalkthroughStep>) =>
    onChange(steps.map((step) => (step.id === id ? { ...step, ...patch } : step)));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(renumber(next));
  };

  const remove = (id: string) =>
    onChange(renumber(steps.filter((step) => step.id !== id)));

  const add = () =>
    onChange(
      renumber([
        ...steps,
        {
          id: crypto.randomUUID(),
          position: steps.length + 1,
          kind: "normal",
          text: "",
        },
      ]),
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className={`${label} text-navy/55`}>Critical Path</h3>
        <span className="text-[11px] text-navy/40">
          {steps.length} {steps.length === 1 ? "step" : "steps"}
        </span>
      </div>

      {steps.length === 0 ? (
        <p className="rounded-card border border-dashed border-navy/20 bg-mist px-4 py-6 text-center text-sm text-navy/45">
          No steps yet. Add the ideal solving steps the AI grades against.
        </p>
      ) : (
        <ol className="flex flex-col gap-2.5">
          {steps.map((step, i) => (
            <li
              key={step.id}
              className="rounded-card border border-navy/15 bg-white p-3"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 flex-none items-center rounded-chip bg-navy px-2 font-display text-[12px] font-bold text-white">
                  Step {step.position}
                </span>

                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    {KINDS.map((k) => {
                      const active = step.kind === k.value;
                      return (
                        <button
                          key={k.value}
                          type="button"
                          onClick={() => update(step.id, { kind: k.value })}
                          aria-pressed={active}
                          className={`rounded-chip px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                            active
                              ? k.value === "confirm_option"
                                ? "bg-gold/20 text-gold-600"
                                : "bg-brand/15 text-brand-600"
                              : "text-navy/40 hover:bg-navy/5"
                          }`}
                        >
                          {k.tag}
                        </button>
                      );
                    })}
                  </div>

                  <input
                    value={step.text}
                    onChange={(e) => update(step.id, { text: e.target.value })}
                    placeholder="Describe this solving step"
                    className="w-full rounded-chip border border-navy/15 bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-navy/35 focus:border-brand-600"
                  />
                  <input
                    value={step.detail ?? ""}
                    onChange={(e) =>
                      update(step.id, { detail: e.target.value || undefined })
                    }
                    placeholder="Detail (optional)"
                    className="w-full rounded-chip border border-navy/10 bg-mist px-3 py-1.5 text-[13px] text-navy/70 outline-none placeholder:text-navy/30 focus:border-brand-600"
                  />
                </div>

                <div className="flex flex-none flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Move step up"
                    className={iconBtn}
                  >
                    <ArrowIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === steps.length - 1}
                    aria-label="Move step down"
                    className={iconBtn}
                  >
                    <ArrowIcon className="h-3.5 w-3.5 rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(step.id)}
                    aria-label="Delete step"
                    className={`${iconBtn} hover:border-danger/40 hover:bg-danger-bg hover:text-danger`}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <button
        type="button"
        onClick={add}
        className="self-start rounded-card border border-dashed border-navy/25 px-3 py-1.5 text-sm font-semibold text-navy/70 transition-colors hover:border-brand-600 hover:text-brand-600"
      >
        + Add Step
      </button>
    </div>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 19V5M5 12l7-7 7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
