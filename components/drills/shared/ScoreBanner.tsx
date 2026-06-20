"use client";

import { useEffect, useState } from "react";
import { label } from "./ui";

// A report-card style result header: a left accent rule, a large score over
// 100, the verdict, and a thin grade bar. Number and bar count up on mount
// (instantly under prefers-reduced-motion). Color shifts with the score.
function toneFor(score: number) {
  if (score >= 100)
    return { accent: "border-l-success", text: "text-success-600", fill: "bg-success", tint: "bg-success-bg" };
  if (score >= 50)
    return { accent: "border-l-flag", text: "text-flag", fill: "bg-flag", tint: "bg-flag-bg" };
  return { accent: "border-l-danger", text: "text-danger-600", fill: "bg-danger", tint: "bg-danger-bg" };
}

export function ScoreBanner({ score, verdict }: { score: number; verdict: string }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduce ? 0 : 850;
    let raf = 0;
    let startTs = 0;
    const tick = (now: number) => {
      if (!startTs) startTs = now;
      const t = duration === 0 ? 1 : Math.min(1, (now - startTs) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(eased * score));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const tone = toneFor(score);

  return (
    <div className="animate-pop-in overflow-hidden rounded-card border border-navy/15 bg-white">
      <div className={`border-l-[3px] ${tone.accent} ${tone.tint} px-5 py-4`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className={`${label} ${tone.text}`}>Score</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span
                className={`font-display text-4xl font-extrabold leading-none tabular-nums ${tone.text}`}
              >
                {shown}
              </span>
              <span className="text-lg font-bold text-navy/40">/100</span>
            </div>
          </div>
          <p className="max-w-[16rem] text-right font-display text-[15px] font-bold leading-snug text-ink">
            {verdict}
          </p>
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-[1px] bg-navy/10">
          <div
            className={`h-full ${tone.fill}`}
            style={{ width: `${Math.max(0, Math.min(100, shown))}%`, transition: "width 80ms linear" }}
          />
        </div>
      </div>
    </div>
  );
}
