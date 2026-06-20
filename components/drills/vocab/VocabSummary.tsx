import Link from "next/link";
import { surface, primaryBtn, secondaryBtn, labelMuted } from "../shared/ui";
import { formatClock } from "../shared/Hud";
import { TrophyIcon, FlameIcon } from "../shared/icons";
import { ClockIcon } from "@/components/test/icons";

// End-of-session recap: words mastered, best streak, and elapsed time, with
// options to run the set again or return to the drills index.

export function VocabSummary({
  total,
  mastered,
  bestStreak,
  seconds,
  savedCount,
  onPracticeAgain,
}: {
  total: number;
  mastered: number;
  bestStreak: number;
  seconds: number;
  savedCount: number;
  onPracticeAgain: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className={`${surface} overflow-hidden`}>
        <div className="border-b border-navy/10 px-6 py-7 text-center sm:px-10">
          <div className={labelMuted}>Session complete</div>
          <h2 className="mt-2 font-display text-3xl font-bold text-navy">Vocab Drill</h2>
          <p className="mt-2 text-sm text-navy/55">
            You matched {mastered} of {total} definitions correctly.
          </p>
        </div>

        <div className="grid grid-cols-1 divide-y divide-navy/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <SummaryStat
            icon={<TrophyIcon className="h-5 w-5" />}
            value={`${mastered}/${total}`}
            label="Words mastered"
          />
          <SummaryStat
            icon={<FlameIcon className="h-5 w-5" />}
            value={String(bestStreak)}
            label="Best streak"
          />
          <SummaryStat
            icon={<ClockIcon className="h-5 w-5" />}
            value={formatClock(seconds)}
            label="Time"
          />
        </div>
      </div>

      {savedCount > 0 ? (
        <p className="mt-4 text-center text-sm text-navy/55">
          {savedCount} {savedCount === 1 ? "word" : "words"} saved to your Vocab Flashcards deck.
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onPracticeAgain} className={primaryBtn}>
          Practice again
        </button>
        <Link href="/drills" className={secondaryBtn}>
          Back to drills
        </Link>
      </div>
    </div>
  );
}

function SummaryStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-6 py-7">
      <span className="text-navy/40">{icon}</span>
      <span className="font-display text-3xl font-bold tabular-nums text-navy">{value}</span>
      <span className={labelMuted}>{label}</span>
    </div>
  );
}
