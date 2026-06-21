import Link from "next/link";
import { Logo } from "@/components/Logo";
import type { NavStats } from "@/lib/gamification";
import { AccountMenu } from "./AccountMenu";
import { FlameIcon } from "./icons";

// Sticky translucent chrome shared by the hub, test picker, and history. The
// primary button points to whichever practice surface you're not currently on;
// History is a persistent tab.
export function AppNav({
  activePage,
  stats,
}: {
  activePage: "drills" | "tests" | "history";
  stats: NavStats;
}) {
  const cta =
    activePage === "drills"
      ? { label: "Practice Tests", href: "/practice-test" }
      : { label: "Practice Drills", href: "/drills" };

  return (
    <header className="sticky top-0 z-40 border-b border-navy/12 bg-white/[0.88] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6">
        <Link href="/drills" aria-label="1500 SAT Blueprint home" className="inline-flex items-center">
          <Logo />
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <span className="hidden items-center gap-1.5 rounded-full border border-gold-600/35 bg-[#fff7e6] px-3 py-[7px] text-sm font-bold text-flag sm:inline-flex">
            <FlameIcon className="h-4 w-4 animate-flicker" />
            {stats.streak}
          </span>

          <span className="hidden items-center gap-[7px] rounded-full bg-navy py-[7px] pl-[9px] pr-3 text-[13px] font-bold text-white sm:inline-flex">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand font-display text-[11px] leading-none">
              {stats.level}
            </span>
            {stats.xp.toLocaleString()} XP
          </span>

          <Link
            href="/history"
            aria-current={activePage === "history" ? "page" : undefined}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
              activePage === "history"
                ? "border-navy bg-navy text-white"
                : "border-navy/20 bg-white text-navy hover:bg-navy/5"
            }`}
          >
            History
          </Link>

          <Link
            href={cta.href}
            className="rounded-lg border border-navy/20 bg-white px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-navy/5"
          >
            {cta.label}
          </Link>

          <AccountMenu name={stats.name} initials={stats.initials} level={stats.level} plan={stats.plan} />
        </div>
      </div>
    </header>
  );
}
