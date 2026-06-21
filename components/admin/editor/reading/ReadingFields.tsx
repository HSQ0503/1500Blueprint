"use client";

import type { DrillQuestion, FieldEditorProps, ReadingContent } from "@/lib/drills/types";
import { MathText } from "@/components/test/MathText";
import { label, secondaryBtn, surface } from "@/components/drills/shared/ui";

// Normalizes whatever is stored in question.content into a complete
// ReadingContent so the editor always has concrete fields to bind to. Unknown
// keys in older content are dropped on the next save, which is fine here.
function read(content: DrillQuestion["content"]): ReadingContent {
  const c = content as Partial<ReadingContent>;
  return {
    body: Array.isArray(c.body) ? c.body : [],
    readSeconds: typeof c.readSeconds === "number" ? c.readSeconds : 0,
    keyPoints: Array.isArray(c.keyPoints) ? c.keyPoints : [],
    level: typeof c.level === "number" ? c.level : undefined,
  };
}

const fieldInput =
  "w-full rounded-[10px] border-[1.5px] border-navy/[0.18] px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-navy/35 focus:border-brand focus:ring-2 focus:ring-brand/15";

// --- Field editor: edits ONLY question.content for the reading drill ----------

export function Fields({ question, onChange }: FieldEditorProps) {
  const content = read(question.content);
  const patch = (next: Partial<ReadingContent>) =>
    onChange({ content: { ...content, ...next } });

  return (
    <div className="space-y-6">
      <ParagraphList
        body={content.body}
        onChange={(body) => patch({ body })}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          label="Read time (seconds)"
          help="Countdown length for the timed read."
          value={content.readSeconds}
          min={0}
          onChange={(v) => patch({ readSeconds: v === "" ? 0 : v })}
        />
        <NumberField
          label="Level"
          help="Difficulty tier shown to the student."
          value={content.level ?? ""}
          min={1}
          onChange={(level) =>
            patch({ level: level === "" ? undefined : level })
          }
        />
      </div>

      <KeyPointList
        keyPoints={content.keyPoints}
        onChange={(keyPoints) => patch({ keyPoints })}
      />
    </div>
  );
}

// --- Body paragraphs (add / remove / edit) ------------------------------------

function ParagraphList({
  body,
  onChange,
}: {
  body: string[];
  onChange: (body: string[]) => void;
}) {
  const setAt = (i: number, value: string) =>
    onChange(body.map((p, idx) => (idx === i ? value : p)));
  const removeAt = (i: number) => onChange(body.filter((_, idx) => idx !== i));
  const add = () => onChange([...body, ""]);

  return (
    <section>
      <SectionHead
        title="Passage body"
        help="Each box is one paragraph shown during the timed read."
      />
      <div className="space-y-3">
        {body.map((para, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-2.5 w-6 shrink-0 text-right text-xs font-semibold tabular-nums text-navy/40">
              {i + 1}
            </span>
            <textarea
              value={para}
              onChange={(e) => setAt(i, e.target.value)}
              placeholder={`Paragraph ${i + 1}`}
              className={`${fieldInput} min-h-[96px] resize-y leading-relaxed`}
            />
            <RemoveBtn label="Remove paragraph" onClick={() => removeAt(i)} />
          </div>
        ))}
        {body.length === 0 ? <Empty text="No paragraphs yet." /> : null}
      </div>
      <button type="button" onClick={add} className={`${secondaryBtn} mt-3`}>
        Add paragraph
      </button>
    </section>
  );
}

// --- Key points (add / remove / reorder) --------------------------------------
// These are what the AI recall grader checks the student summary against, so
// order matters: it mirrors the passage order in the graded checklist.

function KeyPointList({
  keyPoints,
  onChange,
}: {
  keyPoints: string[];
  onChange: (keyPoints: string[]) => void;
}) {
  const setAt = (i: number, value: string) =>
    onChange(keyPoints.map((p, idx) => (idx === i ? value : p)));
  const removeAt = (i: number) =>
    onChange(keyPoints.filter((_, idx) => idx !== i));
  const add = () => onChange([...keyPoints, ""]);
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= keyPoints.length) return;
    const next = [...keyPoints];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <section>
      <SectionHead
        title="Key points"
        help="What the AI recall grader checks the summary against. Order matches the passage."
      />
      <div className="space-y-2.5">
        {keyPoints.map((point, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="mt-0.5 flex flex-col">
              <ReorderBtn
                label="Move up"
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                <ChevronIcon className="h-3.5 w-3.5" />
              </ReorderBtn>
              <ReorderBtn
                label="Move down"
                disabled={i === keyPoints.length - 1}
                onClick={() => move(i, 1)}
              >
                <ChevronIcon className="h-3.5 w-3.5 rotate-180" />
              </ReorderBtn>
            </div>
            <input
              type="text"
              value={point}
              onChange={(e) => setAt(i, e.target.value)}
              placeholder={`Key point ${i + 1}`}
              className={fieldInput}
            />
            <RemoveBtn label="Remove key point" onClick={() => removeAt(i)} />
          </div>
        ))}
        {keyPoints.length === 0 ? <Empty text="No key points yet." /> : null}
      </div>
      <button type="button" onClick={add} className={`${secondaryBtn} mt-3`}>
        Add key point
      </button>
    </section>
  );
}

// --- Small shared field pieces ------------------------------------------------

function NumberField({
  label: text,
  help,
  value,
  min,
  onChange,
}: {
  label: string;
  help: string;
  value: number | "";
  min?: number;
  onChange: (value: number | "") => void;
}) {
  return (
    <label className="block">
      <div className="text-[13px] font-bold text-navy">{text}</div>
      <p className="mt-0.5 mb-2 text-[12.5px] leading-snug text-navy/55">{help}</p>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(e) =>
          onChange(e.target.value === "" ? "" : Number(e.target.value))
        }
        className={fieldInput}
      />
    </label>
  );
}

function SectionHead({ title, help }: { title: string; help: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-[13px] font-bold text-navy">{title}</h3>
      <p className="mt-0.5 text-[12.5px] leading-snug text-navy/55">{help}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-[10px] border border-dashed border-navy/15 px-3.5 py-3 text-sm text-navy/40">
      {text}
    </p>
  );
}

function RemoveBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-navy/15 text-navy/45 transition-colors hover:border-danger/30 hover:bg-danger/10 hover:text-danger"
    >
      <XMarkIcon className="h-4 w-4" />
    </button>
  );
}

function ReorderBtn({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-[18px] w-7 items-center justify-center text-navy/45 transition-colors hover:text-navy disabled:cursor-not-allowed disabled:opacity-25"
    >
      {children}
    </button>
  );
}

// --- Preview: read-only, student-faithful render ------------------------------

export function Preview({ question }: { question: DrillQuestion }) {
  const content = read(question.content);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <article className={`${surface} px-6 py-8 sm:px-10 sm:py-11`}>
        {content.body.length > 0 ? (
          <div className="space-y-5">
            {content.body.map((para, i) => (
              <p
                key={i}
                className="font-serif text-[17px] leading-[1.85] text-exam-ink"
              >
                <MathText>{para}</MathText>
              </p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-navy/40">No passage body yet.</p>
        )}
      </article>

      <div className={surface}>
        <div className="flex items-center justify-between gap-3 border-b border-navy/10 px-4 py-2.5">
          <h3 className={`${label} text-navy/50`}>Key points</h3>
          <span className="text-xs font-semibold tabular-nums text-navy/50">
            {content.body.length} para · {content.readSeconds}s
            {content.level != null ? ` · L${content.level}` : ""}
          </span>
        </div>
        {content.keyPoints.length > 0 ? (
          <ul className="divide-y divide-navy/8">
            {content.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-3 px-4 py-3">
                <span className="mt-0.5 w-5 shrink-0 text-right text-xs font-semibold tabular-nums text-navy/40">
                  {i + 1}
                </span>
                <span className="font-serif text-[15px] leading-snug text-exam-ink">
                  <MathText>{point}</MathText>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-3.5 text-sm text-navy/40">No key points yet.</p>
        )}
      </div>
    </div>
  );
}

// --- Local icons --------------------------------------------------------------

function XMarkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 15l6-6 6 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
