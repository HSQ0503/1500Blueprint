import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SignOutButton } from "@/components/auth/SignOutButton";
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
    <span className="rounded-chip bg-navy/5 px-2 py-0.5 text-[11px] font-medium text-navy/65">
      {children}
    </span>
  );
}

export default async function PracticeTestsPage() {
  const tests = await listTests();

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="border-b border-navy/12 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3.5">
          <Logo />
          <div className="flex items-center gap-2">
            <Link
              href="/drills"
              className="inline-flex items-center gap-2 rounded-card border border-navy/20 px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-navy/5"
            >
              Practice Drills
              <span className="rounded-chip bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-600">
                Soon
              </span>
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <section className="border-b border-navy/12 bg-navy text-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-14">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky">
            Bluebook-style digital SAT
          </div>
          <div className="mt-3 h-px w-12 bg-gold" />
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Full-length practice tests
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-white/70">
            Pick a test below. Each one mirrors the real College Board Bluebook, with timed,
            adaptive modules, the same on-screen tools, and a full score report when you finish.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.16em] text-navy/55">
            Choose a test
          </h2>
          <span className="h-px flex-1 bg-navy/12" />
          <span className="text-xs text-navy/40">
            {tests.length} {tests.length === 1 ? "test" : "tests"}
          </span>
        </div>

        {tests.length === 0 ? (
          <div className="rounded-card border border-navy/15 bg-white p-8 text-center text-navy/60">
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
                    className="group flex h-full items-center gap-4 rounded-card border border-t-[2px] border-navy/15 border-t-brand bg-white p-5 transition-colors hover:border-navy/30"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-chip bg-navy font-display text-xl font-extrabold text-white">
                      {num || "•"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-lg font-bold text-ink">{label}</h3>
                      {form ? <p className="truncate text-sm text-navy/50">{form}</p> : null}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Chip>R&amp;W + Math</Chip>
                        <Chip>4 modules</Chip>
                        <Chip>~2h 14m</Chip>
                        <Chip>Adaptive</Chip>
                      </div>
                    </div>
                    <span className="ml-auto hidden shrink-0 items-center gap-1.5 rounded-card bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-navy-700 sm:inline-flex">
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

        {/* Drills — secondary entry */}
        <Link
          href="/drills"
          className="mt-4 flex items-center gap-4 rounded-card border border-dashed border-gold/50 bg-gold/5 p-5 transition-colors hover:bg-gold/10"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-chip bg-gold/15 text-gold-600">
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
              Short, targeted skill drills with instant AI feedback on your reasoning, not just the
              answer.
            </p>
          </div>
        </Link>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-6 pb-10 pt-2 text-center text-xs text-navy/40">
        1500 SAT Blueprint practice platform. Not affiliated with the College Board. SAT is a
        trademark of the College Board.
      </footer>
    </div>
  );
}
