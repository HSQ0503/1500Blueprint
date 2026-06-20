import Link from "next/link";
import { Logo } from "@/components/Logo";
import { listTests } from "@/lib/sat/loadTest";

export const metadata = {
  title: "Practice Tests — 1500 SAT Blueprint",
  description:
    "Choose a full-length, Bluebook-style digital SAT practice test from the 1500 SAT Blueprint.",
};

function parseTest(slug: string, title: string) {
  const num = slug.match(/(\d+)\s*$/)?.[1] ?? "";
  const form = title.match(/\(([^)]+)\)/)?.[1];
  return { num, label: num ? `Practice Test ${num}` : title, form };
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-ice px-2.5 py-1 text-xs font-medium text-navy-700">
      {children}
    </span>
  );
}

export default async function PracticeTestsPage() {
  const tests = await listTests();

  return (
    <div className="min-h-dvh bg-[#f5f8fc] text-ink">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-navy/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3.5">
          <Logo />
          <Link
            href="/drills"
            className="inline-flex items-center gap-2 rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-ice"
          >
            Practice Drills
            <span className="rounded-full bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-600">
              Soon
            </span>
          </Link>
        </div>
      </header>

      {/* Hero — brand navy with electric-blue streaks (matches the 1500 dashboard) */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-1/4 top-0 h-[160%] w-1/3 -rotate-12 bg-gradient-to-b from-brand/40 via-brand/10 to-transparent blur-2xl" />
          <div className="absolute left-1/3 -top-1/4 h-[180%] w-1/4 -rotate-12 bg-gradient-to-b from-sky/30 to-transparent blur-2xl" />
        </div>
        <div className="relative mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-sky ring-1 ring-inset ring-white/15">
            Bluebook-style digital SAT
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Full-length practice tests
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
            Pick a test below. Each one mirrors the real College Board Bluebook —
            timed, adaptive modules, the same on-screen tools, and a full score
            report when you finish.
          </p>
        </div>
      </section>

      {/* Test list */}
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-bold text-ink">Choose a test</h2>
          <span className="text-sm text-navy/50">
            {tests.length} {tests.length === 1 ? "test" : "tests"} available
          </span>
        </div>

        {tests.length === 0 ? (
          <div className="rounded-2xl border border-navy/10 bg-white p-8 text-center text-navy/60">
            No tests are available right now. Please check back soon.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {tests.map((t) => {
              const { num, label, form } = parseTest(t.slug, t.title);
              return (
                <li key={t.slug}>
                  <Link
                    href={`/practice-test/${t.slug}`}
                    className="group flex h-full items-center gap-4 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-navy font-display text-2xl font-extrabold text-white">
                      {num || "•"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-lg font-bold text-ink">{label}</h3>
                      {form && <p className="truncate text-sm text-navy/50">{form}</p>}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Chip>R&amp;W + Math</Chip>
                        <Chip>4 modules</Chip>
                        <Chip>~2h 14m</Chip>
                        <Chip>Adaptive</Chip>
                      </div>
                    </div>
                    <span className="ml-auto hidden shrink-0 items-center gap-1 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-brand-600 sm:inline-flex">
                      Start
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M7 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {/* Drills — secondary entry, not built yet */}
        <Link
          href="/drills"
          className="mt-4 flex items-center gap-4 rounded-2xl border border-dashed border-gold/50 bg-gold/5 p-5 transition-colors hover:bg-gold/10"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-600">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M13 2 4.5 13H11l-1 9 8.5-11H12l1-9z" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-bold text-ink">
              Practice Drills
              <span className="ml-2 align-middle text-xs font-bold uppercase tracking-wide text-gold-600">
                Coming soon
              </span>
            </h3>
            <p className="text-sm text-navy/55">
              Short, targeted skill drills with instant AI feedback on your
              reasoning — not just the answer.
            </p>
          </div>
        </Link>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-6 pb-10 pt-2 text-center text-xs text-navy/40">
        1500 SAT Blueprint — practice platform. Not affiliated with the College
        Board. SAT is a trademark of the College Board.
      </footer>
    </div>
  );
}
