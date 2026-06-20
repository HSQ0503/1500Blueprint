import Link from "next/link";
import type { Accent } from "@/lib/drills/types";
import type { DrillCard as DrillCardData } from "@/lib/drills/registry";
import { DrillGlyph, HistoryIcon, PlayIcon, SlidersIcon, SparkIcon, TrendIcon } from "./icons";
import { chip, label, primaryBtn, secondaryBtn } from "./ui";

// The only per-card color: a thin top rule for quiet, catalog-style wayfinding.
const TOP: Record<Accent, string> = {
  brand: "border-t-brand",
  navy: "border-t-navy",
  sky: "border-t-sky",
  gold: "border-t-gold",
};

function SecondaryIcon({ text }: { text: string }) {
  const t = text.toLowerCase();
  if (t.includes("manage")) return <SlidersIcon className="h-4 w-4" />;
  if (t.includes("progress")) return <TrendIcon className="h-4 w-4" />;
  return <HistoryIcon className="h-4 w-4" />;
}

export function DrillCard({ card }: { card: DrillCardData }) {
  return (
    <div
      className={`group flex h-full flex-col rounded-card border border-t-[2px] border-navy/15 bg-white transition-colors hover:border-navy/30 ${TOP[card.accent]}`}
    >
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-chip border border-navy/15 text-navy/70">
              <DrillGlyph name={card.icon} className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className={`${label} text-navy/45`}>{card.category}</div>
              <h3 className="font-display text-base font-bold leading-tight text-ink">
                {card.title}
                {card.badge ? (
                  <span className="ml-1.5 align-middle text-xs font-semibold text-navy/45">
                    · {card.badge}
                  </span>
                ) : null}
              </h3>
            </div>
          </div>
          {card.beta ? (
            <span className={`${chip} shrink-0 bg-brand/10 text-brand-600`}>Beta</span>
          ) : card.usesAI ? (
            <span className={`${chip} shrink-0 bg-brand/10 text-brand-600`}>
              <SparkIcon className="h-3 w-3" />
              AI
            </span>
          ) : null}
        </div>

        <p className="mt-3 text-sm leading-snug text-navy/60">{card.tagline}</p>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-navy/10 pt-3">
          {card.stats.map((s) => (
            <span key={s.label} className="text-sm text-navy/55">
              <span className="font-bold text-navy">{s.value}</span> {s.label}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-2 pt-5">
          {card.ctas.map((c) => (
            <Link key={c.label} href={c.href} className={`${primaryBtn} flex-1`}>
              <PlayIcon className="h-3.5 w-3.5" />
              {c.label}
            </Link>
          ))}
          {card.secondary ? (
            <Link href={card.secondary.href} className={`${secondaryBtn} shrink-0`}>
              <SecondaryIcon text={card.secondary.label} />
              <span className="hidden sm:inline">{card.secondary.label}</span>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
