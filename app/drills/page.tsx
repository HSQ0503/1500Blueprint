import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { DrillCard } from "@/components/drills/shared/DrillCard";
import { CATEGORY_ORDER, DRILL_CARDS } from "@/lib/drills/registry";

export const metadata = {
  title: "Practice Drills — 1500 SAT Blueprint",
  description:
    "Short, targeted SAT skill drills with instant AI feedback on your reasoning, not just your answer.",
};

export default function DrillsPage() {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="border-b border-navy/12 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3.5">
          <Logo />
          <div className="flex items-center gap-2">
            <Link
              href="/practice-test"
              className="rounded-card border border-navy/20 px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-navy/5"
            >
              Practice Tests
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <section className="border-b border-navy/12 bg-navy text-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-14">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky">
            1500 SAT Blueprint · Practice
          </div>
          <div className="mt-3 h-px w-12 bg-gold" />
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Practice Drills
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-white/70">
            Short, targeted drills that grade how you think, not just what you pick. Explain your
            process, get an instant score, and master one pattern at a time.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="space-y-10">
          {CATEGORY_ORDER.map((cat) => {
            const cards = DRILL_CARDS.filter((c) => c.category === cat);
            if (cards.length === 0) return null;
            return (
              <section key={cat}>
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-[12px] font-bold uppercase tracking-[0.16em] text-navy/55">
                    {cat}
                  </h2>
                  <span className="h-px flex-1 bg-navy/12" />
                  <span className="text-xs text-navy/40">
                    {cards.length} {cards.length === 1 ? "drill" : "drills"}
                  </span>
                </div>
                <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {cards.map((card) => (
                    <li key={card.key}>
                      <DrillCard card={card} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 pb-10 pt-2 text-center text-xs text-navy/40">
        1500 SAT Blueprint practice platform. Not affiliated with the College Board. SAT is a
        trademark of the College Board.
      </footer>
    </div>
  );
}
