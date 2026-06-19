"use client";

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
        autoComplete="off"
        aria-label="Enter your answer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-exam-border bg-white px-4 py-3 font-serif text-xl text-exam-ink outline-none focus:border-exam-blue focus:ring-1 focus:ring-exam-blue"
      />
      <div className="mt-3 text-[15px] text-exam-muted">
        Answer Preview:{" "}
        <span className="font-serif text-exam-ink">{value.trim() || "—"}</span>
      </div>
    </div>
  );
}
