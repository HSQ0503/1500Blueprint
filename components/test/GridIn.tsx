"use client";

import { normalizeGridInInput } from "@/lib/sat/gridIn";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

// Student-produced response — mirrors Bluebook's typed entry + live "Answer preview".
export function GridIn({ value, onChange }: Props) {
  return (
    <div className="max-w-md">
      <input
        type="text"
        inputMode="text"
        maxLength={6}
        pattern="-?[0-9]*[./]?[0-9]*"
        autoComplete="off"
        aria-label="Enter your answer, up to four digits"
        aria-describedby="grid-in-limit"
        value={value}
        onChange={(event) => onChange(normalizeGridInInput(event.target.value))}
        className="w-full rounded-lg border border-exam-border bg-white px-4 py-3 font-serif text-xl text-exam-ink outline-none focus:border-exam-blue focus:ring-1 focus:ring-exam-blue"
      />
      <div className="mt-3 text-[15px] text-exam-muted">
        Answer Preview:{" "}
        <span className="font-serif text-exam-ink">{value.trim() || "—"}</span>
      </div>
      <p id="grid-in-limit" className="mt-1 text-[13px] text-exam-muted">
        Up to 4 digits. Decimals, fractions, and negative answers are allowed.
      </p>
    </div>
  );
}
