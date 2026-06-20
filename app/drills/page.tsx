import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = {
  title: "Practice Drills — 1500 SAT Blueprint",
};

export default function DrillsPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#f5f8fc] text-ink">
      <header className="border-b border-navy/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3.5">
          <Logo />
          <Link
            href="/practice-test"
            className="rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-ice"
          >
            ← Practice Tests
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/15 text-gold-600">
          <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M13 2 4.5 13H11l-1 9 8.5-11H12l1-9z" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight text-ink">
          Practice Drills
        </h1>
        <p className="mt-3 max-w-md leading-7 text-navy/60">
          Short, targeted skill drills with instant AI feedback on your reasoning
          are coming soon. For now, sharpen up with a full-length practice test.
        </p>
        <Link
          href="/practice-test"
          className="mt-8 inline-flex h-12 items-center rounded-full bg-navy px-7 text-base font-semibold text-white transition-colors hover:bg-navy-700"
        >
          Browse practice tests
        </Link>
      </main>
    </div>
  );
}
