import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon } from "@/components/test/icons";

// Branded chrome shared by every drill: a flat sticky top bar (exit + an
// optional eyebrow/title, a centered slot for a timer or counter, and a right
// slot for HUD/tools) over the paper surface. Works as a server component
// (Link exit) or inside a client runner (onExit handler).
type DrillShellProps = {
  title: ReactNode;
  eyebrow?: string;
  exitHref?: string;
  onExit?: () => void;
  exitLabel?: string;
  center?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
};

export function DrillShell({
  title,
  eyebrow,
  exitHref = "/drills",
  onExit,
  exitLabel = "Exit",
  center,
  right,
  children,
}: DrillShellProps) {
  const exitClasses =
    "inline-flex items-center gap-1.5 rounded-card px-2.5 py-1.5 text-sm font-semibold text-navy/70 transition-colors hover:bg-navy/5 hover:text-navy";

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <header className="sticky top-0 z-30 border-b border-navy/12 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-3 py-2 sm:gap-3 sm:px-6 sm:py-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {onExit ? (
              <button type="button" onClick={onExit} className={exitClasses}>
                <ArrowLeftIcon className="h-4 w-4" />
                {exitLabel}
              </button>
            ) : (
              <Link href={exitHref} className={exitClasses}>
                <ArrowLeftIcon className="h-4 w-4" />
                {exitLabel}
              </Link>
            )}
            <span className="hidden h-6 w-px bg-navy/12 sm:block" />
            <div className="hidden min-w-0 sm:block">
              {eyebrow ? (
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-navy/40">
                  {eyebrow}
                </div>
              ) : null}
              <div className="truncate text-sm font-bold text-navy">{title}</div>
            </div>
          </div>
          {center ? (
            <div className="flex min-w-0 shrink items-center justify-center">{center}</div>
          ) : null}
          <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2">{right}</div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
