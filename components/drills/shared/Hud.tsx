import type { ReactNode } from "react";
import { ClockIcon } from "@/components/test/icons";
import { HeartIcon, HeartOutlineIcon } from "./icons";

// Presentational HUD primitives. The drill runner owns the live values (time,
// lives, streak) and passes them down, so these stay pure and easy to compose.

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function StatPill({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-navy/70">
      {icon ? <span className="text-navy/45 [&>svg]:h-4 [&>svg]:w-4">{icon}</span> : null}
      {children}
    </span>
  );
}

export function StreakDots({ streak, target }: { streak: number; target: number }) {
  return (
    <span
      className="inline-flex items-center gap-1.5"
      aria-label={`Mastery streak ${streak} of ${target}`}
    >
      {Array.from({ length: target }).map((_, i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full transition-colors ${
            i < streak ? "bg-brand" : "border border-navy/25"
          }`}
        />
      ))}
    </span>
  );
}

export function LivesHud({ total, remaining }: { total: number; remaining: number }) {
  return (
    <span
      className="inline-flex items-center gap-1"
      aria-label={`${remaining} of ${total} lives remaining`}
    >
      {Array.from({ length: total }).map((_, i) =>
        i < remaining ? (
          <HeartIcon key={i} className="h-5 w-5 text-danger" />
        ) : (
          <HeartOutlineIcon key={i} className="h-5 w-5 text-navy/25" />
        ),
      )}
    </span>
  );
}

// Continuous thin progress bar (square ends for a crisp, ruled look).
export function ProgressBar({
  value,
  max,
  className,
}: {
  value: number;
  max: number;
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={`h-1 w-full overflow-hidden rounded-[1px] bg-navy/12 ${className ?? ""}`}>
      <div
        className="h-full rounded-[1px] bg-brand transition-[width] duration-300 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// Segmented progress (one tick per question), Word Scan / Vocab style.
export function SegmentedProgress({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex w-full gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1 flex-1 rounded-[1px] transition-colors ${
            i < current ? "bg-brand" : "bg-navy/12"
          }`}
        />
      ))}
    </div>
  );
}

export function DigitalTimer({ seconds, warning }: { seconds: number; warning?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-chip px-2.5 py-1 text-sm font-semibold tabular-nums ${
        warning ? "bg-danger/10 text-danger" : "bg-navy/6 text-navy"
      }`}
    >
      <ClockIcon className="h-4 w-4" />
      {formatClock(seconds)}
    </span>
  );
}

// Fast per-question countdown ring (Word Scan style). `seconds` shown to one
// decimal; the ring drains as it approaches zero.
export function RingTimer({ seconds, total }: { seconds: number; total: number }) {
  const r = 22;
  const circumference = 2 * Math.PI * r;
  const frac = total > 0 ? Math.max(0, Math.min(1, seconds / total)) : 0;
  const low = seconds <= total * 0.34;
  return (
    <div className="relative inline-flex h-14 w-14 items-center justify-center">
      <svg viewBox="0 0 52 52" className="h-14 w-14 -rotate-90">
        <circle cx="26" cy="26" r={r} fill="none" strokeWidth="4" className="stroke-navy/12" />
        <circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          className={`transition-[stroke-dashoffset] duration-200 ease-linear ${
            low ? "stroke-danger" : "stroke-brand"
          }`}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - frac)}
        />
      </svg>
      <span
        className={`absolute text-sm font-bold tabular-nums ${low ? "text-danger" : "text-navy"}`}
      >
        {seconds.toFixed(1)}
      </span>
    </div>
  );
}
