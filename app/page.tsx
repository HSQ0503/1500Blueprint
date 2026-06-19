import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-navy text-white">
      {/* Hero light streaks (brand: electric-blue diagonals on deep navy) */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-1/4 top-0 h-[140%] w-1/3 -rotate-12 bg-gradient-to-b from-brand/40 via-brand/10 to-transparent blur-2xl" />
        <div className="absolute left-1/3 -top-1/4 h-[160%] w-1/4 -rotate-12 bg-gradient-to-b from-sky/30 to-transparent blur-2xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/0 via-navy/40 to-ink" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Logo className="text-white [&_.text-navy]:text-white" />
        <Link
          href="/practice-test"
          className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
        >
          Sign in
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-sky ring-1 ring-inset ring-white/15">
          Bluebook-style digital SAT practice
        </span>
        <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl">
          Practice like it&rsquo;s the
          <br className="hidden sm:block" /> real thing.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">
          Full-length, adaptive practice tests that mirror the College Board
          Bluebook experience — timed modules, the same tools, and a results
          report that shows exactly where and why you went wrong.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/practice-test"
            className="inline-flex h-12 items-center justify-center rounded-full bg-gold px-8 text-base font-semibold text-navy shadow-lg shadow-gold/20 transition-colors hover:bg-gold-600"
          >
            Start a practice test
          </Link>
          <span className="text-sm text-white/60">
            No account needed for this demo
          </span>
        </div>

        <dl className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
          {[
            { k: "2 sections, 4 modules", v: "Reading & Writing, then Math — each adapts to you." },
            { k: "Real timing & tools", v: "Per-module timer, calculator, reference, mark for review." },
            { k: "Know your gaps", v: "Per-question explanations and domain-by-domain breakdown." },
          ].map((f) => (
            <div
              key={f.k}
              className="rounded-2xl bg-white/5 p-5 ring-1 ring-inset ring-white/10 backdrop-blur-sm"
            >
              <dt className="font-display font-bold text-white">{f.k}</dt>
              <dd className="mt-1 text-sm leading-6 text-white/70">{f.v}</dd>
            </div>
          ))}
        </dl>
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-6xl px-6 py-8 text-center text-sm text-white/50">
        1500 SAT Blueprint — practice platform. Not affiliated with the College
        Board. SAT is a trademark of the College Board.
      </footer>
    </div>
  );
}
