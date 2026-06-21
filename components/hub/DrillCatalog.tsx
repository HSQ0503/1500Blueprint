import Link from "next/link";
import { drillStats, patternOfTheDay } from "@/lib/gamification";
import { DrillIcon, type DrillIconKey } from "./icons";
import { PlayIcon } from "@/components/shell/icons";

const HREF = {
  grammar: "/drills/grammar",
  reading: "/drills/reading",
  wordScanCeased: "/drills/word-scan?mode=ceased",
  wordScanBadMold: "/drills/word-scan?mode=bad-mold",
  mathMedium: "/drills/targeted-math?difficulty=medium",
  mathHard: "/drills/targeted-math?difficulty=hard",
  aiMath: "/drills/ai-math",
  vocab: "/drills/vocab",
  flashcards: "/drills/flashcards",
};

function CategoryHeader({ title }: { title: string }) {
  return (
    <div className="mb-3.5 flex items-center gap-3">
      <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-navy/55">{title}</h3>
      <span className="h-px flex-1 bg-navy/12" />
    </div>
  );
}

function IconTile({ name, large = true }: { name: DrillIconKey; large?: boolean }) {
  return (
    <span
      className={`flex flex-none items-center justify-center bg-[#eef3fb] text-[#2b6fd6] ${
        large ? "h-10 w-10 rounded-[11px]" : "h-[38px] w-[38px] rounded-[10px]"
      }`}
    >
      <DrillIcon name={name} className={large ? "h-[21px] w-[21px]" : "h-5 w-5"} />
    </span>
  );
}

const cardBox = "flex h-full flex-col rounded-2xl bg-white p-[22px] shadow-pop";
const startBtn =
  "inline-flex flex-1 items-center justify-center gap-[7px] rounded-[11px] bg-brand px-3 py-3 text-sm font-bold text-white shadow-[0_2px_0_#2b8fe0] transition-transform active:translate-y-px";
const ghostBtn = "rounded-[11px] bg-haze px-4 py-3 text-[13px] font-semibold text-navy transition-colors hover:bg-navy/10";

export function DrillCatalog() {
  return (
    <div className="mx-auto w-full max-w-[1120px] px-6 pb-12 pt-[30px]">
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em] text-navy">Practice Drills</h2>
        <span className="text-[13px] text-navy/50">Earn XP. Build streaks. Master one pattern at a time.</span>
      </div>

      {/* Writing */}
      <CategoryHeader title="Writing" />
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className={cardBox}>
          <div className="flex items-center gap-3.5">
            <IconTile name="grammar" />
            <div className="min-w-0">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-navy/40">
                Writing <span className="text-brand-600">· AI</span>
              </div>
              <h4 className="mt-0.5 font-display text-lg font-bold leading-[1.15] tracking-[-0.01em] text-[#152347]">
                Grammar Drill
              </h4>
            </div>
          </div>
          <p className="mt-[13px] text-[13.5px] leading-[1.55] text-navy/60">
            Master grammar patterns by writing out your reasoning, graded on process, not just the pick.
          </p>
          <div className="mt-4">
            <div className="mb-[7px] flex items-center justify-between text-[11.5px] font-semibold text-navy/50">
              <span>
                {drillStats.grammar.mastered} / {drillStats.grammar.totalPatterns} patterns mastered
              </span>
              <span className="inline-flex items-center gap-1 text-flag">
                <svg viewBox="0 0 24 24" className="h-[13px] w-[13px]" aria-hidden="true">
                  <path d="M12 3s5 3.5 5 8.5a5 5 0 0 1-10 0c0-1.6.6-2.8 1.3-3.6.2 1.2.9 1.9 1.7 2.1C9.4 7.8 12 6.3 12 3z" fill="#ffbd20" stroke="#f0a900" strokeWidth="1.2" />
                </svg>
                {drillStats.grammar.streak} streak
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-navy/[0.09]">
              <div className="h-full rounded-full bg-brand" style={{ width: `${drillStats.grammar.barPct}%` }} />
            </div>
          </div>
          <div className="mt-auto flex items-center gap-2.5 pt-[18px]">
            <Link href={HREF.grammar} className={startBtn}>
              <PlayIcon className="h-3.5 w-3.5" />
              Start · +{drillStats.grammar.xpReward} XP
            </Link>
            <Link href={HREF.grammar} className={ghostBtn}>
              History
            </Link>
          </div>
        </div>

        {/* Pattern of the day */}
        <div className="relative flex flex-col justify-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#0b2a5b,#1b46a8)] p-6 text-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-5 -right-2.5 font-display font-black leading-none text-white/[0.06]"
            style={{ fontSize: "120px" }}
          >
            +
          </div>
          <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-sky">Pattern of the day</div>
          <h4 className="mt-2 font-display text-[22px] font-bold tracking-[-0.01em]">{patternOfTheDay.title}</h4>
          <p className="mt-2.5 max-w-[280px] text-[13.5px] leading-[1.55] text-white/70">
            Nail this one twice in a row for a <strong className="text-gold">2× XP</strong> bonus and a fresh badge.
          </p>
          <Link
            href={HREF.grammar}
            className="mt-[18px] self-start rounded-[11px] bg-gold px-[19px] py-[11px] text-[13.5px] font-bold text-navy shadow-[0_2px_0_#d99a00] transition-transform active:translate-y-px"
          >
            Take the challenge
          </Link>
        </div>
      </div>

      {/* Reading */}
      <CategoryHeader title="Reading" />
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className={cardBox}>
          <div className="flex items-center gap-3.5">
            <IconTile name="reading" />
            <div className="min-w-0">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-navy/40">
                Reading <span className="text-brand-600">· AI</span>
              </div>
              <h4 className="mt-0.5 font-display text-lg font-bold leading-[1.15] tracking-[-0.01em] text-[#152347]">
                Reading Comprehension
              </h4>
            </div>
          </div>
          <p className="mt-[13px] text-[13.5px] leading-[1.55] text-navy/60">
            Comprehend hard SAT passages under time pressure, then recall the gist from memory.
          </p>
          <div className="mt-4">
            <div className="mb-[7px] flex items-center justify-between text-[11.5px] font-semibold text-navy/50">
              <span>
                Level {drillStats.reading.level} · {drillStats.reading.attempts} attempts
              </span>
              <span>Next: Level {drillStats.reading.level + 1}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-navy/[0.09]">
              <div className="h-full rounded-full bg-brand" style={{ width: `${drillStats.reading.barPct}%` }} />
            </div>
          </div>
          <div className="mt-auto flex items-center gap-2.5 pt-[18px]">
            <Link href={HREF.reading} className={startBtn}>
              <PlayIcon className="h-3.5 w-3.5" />
              Start · +{drillStats.reading.xpReward} XP
            </Link>
            <Link href={HREF.reading} className={ghostBtn}>
              History
            </Link>
          </div>
        </div>

        <div className={cardBox}>
          <div className="flex items-center gap-3.5">
            <IconTile name="scan" />
            <div className="min-w-0">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-navy/40">Reading · Speed</div>
              <h4 className="mt-0.5 font-display text-lg font-bold leading-[1.15] tracking-[-0.01em] text-[#152347]">
                Word Scan Drill
              </h4>
            </div>
          </div>
          <p className="mt-[13px] text-[13.5px] leading-[1.55] text-navy/60">
            Train your eye to spot elimination keywords before the timer drains. Pure speed reps.
          </p>
          <div className="mt-4 flex gap-2.5 text-xs text-navy/55">
            <span className="flex-1 rounded-[10px] bg-[#f3f6fb] px-3 py-[9px]">
              <strong className="block font-display text-sm text-navy">—</strong>Ceased
            </span>
            <span className="flex-1 rounded-[10px] bg-[#f3f6fb] px-3 py-[9px]">
              <strong className="block font-display text-sm text-navy">—</strong>Bad Mold
            </span>
          </div>
          <div className="mt-auto flex gap-2.5 pt-[18px]">
            <Link
              href={HREF.wordScanCeased}
              className="flex-1 rounded-[11px] bg-haze px-3 py-3 text-center text-[13.5px] font-bold text-navy transition-colors hover:bg-navy/10"
            >
              Ceased
            </Link>
            <Link
              href={HREF.wordScanBadMold}
              className="flex-1 rounded-[11px] bg-haze px-3 py-3 text-center text-[13.5px] font-bold text-navy transition-colors hover:bg-navy/10"
            >
              Bad Mold
            </Link>
          </div>
        </div>
      </div>

      {/* Math */}
      <CategoryHeader title="Math" />
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MathCard
          name="target"
          tier="Medium"
          tierClass="text-success-600"
          desc="Get 10 right before you lose all 3 lives."
          stats={[
            { v: drillStats.mathMedium.accuracy, l: "acc" },
            { v: drillStats.mathMedium.avg, l: "avg" },
          ]}
          href={HREF.mathMedium}
          cta="Start Challenge"
          ctaClass="bg-navy text-white shadow-[0_2px_0_#07193b]"
        />
        <MathCard
          name="target"
          tier="Hard"
          tierClass="text-danger-600"
          desc="Same rules, brutal questions. For 1500-chasers."
          stats={[
            { v: drillStats.mathHard.accuracy, l: "acc" },
            { v: drillStats.mathHard.avg, l: "avg" },
          ]}
          href={HREF.mathHard}
          cta="Start Challenge"
          ctaClass="bg-navy text-white shadow-[0_2px_0_#07193b]"
        />
        <MathCard
          name="aimath"
          tier="Beta"
          tierClass="text-brand-600"
          title="AI Math"
          desc="Fresh AI-generated questions tuned to your weak spots."
          stats={[
            { v: drillStats.aiMath.accuracy, l: "acc" },
            { v: drillStats.aiMath.pool, l: "pool" },
          ]}
          href={HREF.aiMath}
          cta="Start Practice"
          ctaClass="bg-brand text-white shadow-[0_2px_0_#2b8fe0]"
        />
      </div>

      {/* Vocabulary */}
      <CategoryHeader title="Vocabulary" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className={cardBox}>
          <div className="flex items-center gap-3.5">
            <IconTile name="vocab" />
            <div className="min-w-0">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-navy/40">Vocabulary</div>
              <h4 className="mt-0.5 font-display text-lg font-bold leading-[1.15] tracking-[-0.01em] text-[#152347]">
                Vocab Drill
              </h4>
            </div>
          </div>
          <p className="mt-[13px] text-[13.5px] leading-[1.55] text-navy/60">
            Match definitions to terms in a timed session. Beat your best streak.
          </p>
          <div className="mt-4 flex gap-4 text-xs text-navy/55">
            <span>
              <strong className="text-navy">{drillStats.vocab.words}</strong> words
            </span>
            <span>
              <strong className="text-navy">{drillStats.vocab.mastered}</strong> mastered
            </span>
            <span>
              <strong className="text-navy">{drillStats.vocab.bestStreak}</strong> best streak
            </span>
          </div>
          <div className="mt-auto flex gap-2.5 pt-[18px]">
            <Link href={HREF.vocab} className={startBtn}>
              <PlayIcon className="h-3.5 w-3.5" />
              Start · +{drillStats.vocab.xpReward} XP
            </Link>
            <Link href={HREF.vocab} className={ghostBtn}>
              Progress
            </Link>
          </div>
        </div>

        <div className={cardBox}>
          <div className="flex items-center gap-3.5">
            <IconTile name="flashcards" />
            <div className="min-w-0">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-navy/40">Vocabulary</div>
              <h4 className="mt-0.5 font-display text-lg font-bold leading-[1.15] tracking-[-0.01em] text-[#152347]">
                Vocab Flashcards
              </h4>
            </div>
          </div>
          <p className="mt-[13px] text-[13.5px] leading-[1.55] text-navy/60">
            Review the words you save from the Vocab Drill with spaced repetition.
          </p>
          <div className="mt-4 flex gap-4 text-xs text-navy/55">
            <span>
              <strong className="text-navy">{drillStats.flashcards.inDeck}</strong> in deck
            </span>
            <span>
              <strong className="text-navy">{drillStats.flashcards.due}</strong> due
            </span>
          </div>
          <div className="mt-auto flex gap-2.5 pt-[18px]">
            <Link
              href={HREF.flashcards}
              className="flex-1 rounded-[11px] bg-haze px-3 py-3 text-center text-sm font-bold text-navy transition-colors hover:bg-navy/10"
            >
              Instructions
            </Link>
            <Link href={HREF.flashcards} className={ghostBtn}>
              Manage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function MathCard({
  name,
  tier,
  tierClass,
  title = "Targeted Math",
  desc,
  stats,
  href,
  cta,
  ctaClass,
}: {
  name: DrillIconKey;
  tier: string;
  tierClass: string;
  title?: string;
  desc: string;
  stats: { v: string; l: string }[];
  href: string;
  cta: string;
  ctaClass: string;
}) {
  return (
    <div className="flex flex-col rounded-2xl bg-white p-5 shadow-pop">
      <div className="flex items-center gap-3">
        <IconTile name={name} large={false} />
        <div>
          <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-navy/40">
            Math <span className={tierClass}>· {tier}</span>
          </div>
          <h4 className="mt-0.5 font-display text-[17px] font-bold tracking-[-0.01em] text-[#152347]">{title}</h4>
        </div>
      </div>
      <p className="mt-[13px] text-[13px] leading-[1.55] text-navy/60">{desc}</p>
      <div className="mt-[13px] flex gap-4 text-xs text-navy/55">
        {stats.map((s) => (
          <span key={s.l}>
            <strong className="text-navy">{s.v}</strong> {s.l}
          </span>
        ))}
      </div>
      <Link
        href={href}
        className={`mt-auto rounded-[11px] px-3 py-3 text-center text-[13.5px] font-bold transition-transform active:translate-y-px ${ctaClass}`}
      >
        {cta}
      </Link>
    </div>
  );
}
