import type { Badge } from "@/lib/gamification";
import { ChevronRightIcon } from "@/components/shell/icons";

type Props = { data: { unlocked: number; total: number; badges: Badge[] } };

// Shield "gem" badges. Unlocked use the blue gradient + gold laurels; locked are
// greyed and dimmed.
export function Achievements({ data }: Props) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-navy/12 bg-white">
      <div className="flex items-center justify-between border-b border-navy/10 px-[18px] py-3.5">
        <div>
          <h3 className="font-display text-[15px] font-bold text-navy">Achievements</h3>
          <div className="mt-0.5 text-xs text-navy/50">
            {data.unlocked} of {data.total} unlocked
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-[5px] rounded-lg border border-navy/20 bg-white px-[13px] py-1.5 text-[13px] font-semibold text-navy transition-colors hover:bg-navy/5"
        >
          Show all
          <ChevronRightIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <svg width="0" height="0" className="absolute h-0 w-0">
        <defs>
          <linearGradient id="gemBlue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#9fdaff" />
            <stop offset="0.45" stopColor="#3fa9f5" />
            <stop offset="1" stopColor="#0b2a5b" />
          </linearGradient>
          <linearGradient id="gemGrey" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e3e8ef" />
            <stop offset="1" stopColor="#aeb7c6" />
          </linearGradient>
        </defs>
      </svg>

      <div className="flex flex-wrap justify-between gap-x-1 gap-y-1.5 p-[18px]">
        {data.badges.slice(0, 10).map((b, i) => (
          <div
            key={`${b.label}-${i}`}
            title={b.locked ? `Locked — ${b.label}` : b.label}
            className="flex flex-col items-center"
            style={{ opacity: b.locked ? 0.4 : 1, filter: b.locked ? "grayscale(0.3)" : "none" }}
          >
            <svg viewBox="0 0 48 60" className="h-[58px] w-[46px]">
              <path
                d="M24 3 L43 10 V30 C43 44 34 52 24 57 C14 52 5 44 5 30 V10 Z"
                fill={b.locked ? "url(#gemGrey)" : "url(#gemBlue)"}
                stroke="#fff"
                strokeWidth="1.6"
              />
              <path
                d="M24 3 L24 57 M5 10 L24 24 L43 10 M5 30 L24 24 L43 30"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="0.9"
                fill="none"
              />
              <path d={b.glyph} transform="translate(24 27)" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="-mt-1.5 flex gap-px">
              <svg viewBox="0 0 30 12" className="h-[11px] w-[30px]">
                <path d="M3 2 C6 5 6 9 4 11 M3 2 C1 5 2 8 4 11" stroke={b.locked ? "rgba(11,42,91,0.2)" : "#f0a900"} strokeWidth="1.3" fill="none" />
                <path d="M27 2 C24 5 24 9 26 11 M27 2 C29 5 28 8 26 11" stroke={b.locked ? "rgba(11,42,91,0.2)" : "#f0a900"} strokeWidth="1.3" fill="none" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
