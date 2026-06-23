import Link from "next/link";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/shell/AppNav";
import { ChevronRightIcon } from "@/components/shell/icons";
import { getSession } from "@/lib/auth/session";
import { getNavStats, listTestAttempts } from "@/lib/gamification/state";
import { listTests } from "@/lib/sat/loadTest";

export const metadata = {
  title: "Your attempts · 1500 SAT Blueprint",
};

function formatTaken(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Next 16: route params are async.
export default async function AttemptsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const [nav, attempts, tests] = await Promise.all([
    getNavStats(session.email),
    listTestAttempts(session.email, slug),
    listTests(),
  ]);

  const title = tests.find((t) => t.slug === slug)?.title ?? slug;
  const num = slug.match(/(\d+)\s*$/)?.[1] ?? "";
  const label = num ? `Practice Test ${num}` : title;

  return (
    <div className="min-h-dvh bg-haze text-ink">
      <AppNav activePage="tests" stats={nav} />
      <main className="mx-auto w-full max-w-[860px] px-6 pb-12 pt-7">
        <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-navy/50">
          <Link href="/practice-test" className="hover:text-navy">
            Practice Tests
          </Link>
          <span aria-hidden>/</span>
          <span className="text-navy/70">{label}</span>
        </div>
        <h1 className="font-display text-2xl font-extrabold text-navy">Your attempts</h1>
        <p className="mt-1 text-sm text-navy/55">
          Every time you have finished {label}, newest first. Open one to see the full score report.
        </p>

        {attempts.length === 0 ? (
          <div className="mt-6 rounded-xl border border-navy/15 bg-white p-8 text-center text-navy/60">
            You have not finished this test yet.{" "}
            <Link href={`/practice-test/${slug}`} className="font-semibold text-brand-600">
              Start it now
            </Link>
            .
          </div>
        ) : (
          <ul className="mt-5 space-y-2.5">
            {attempts.map((a, i) => (
              <li key={a.id}>
                <Link
                  href={`/practice-test/${slug}/results/${a.id}`}
                  className="group flex items-center gap-4 rounded-xl border border-navy/15 bg-white p-4 transition-colors hover:border-navy/30"
                >
                  <div className="flex h-11 w-11 flex-none items-center justify-center rounded-[10px] bg-navy font-display text-base font-extrabold text-white">
                    {attempts.length - i}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-lg font-bold text-ink">
                      {a.totalScore ?? "-"}
                      <span className="ml-1 text-xs font-semibold text-navy/45">/ 1600</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[12px] text-navy/55">
                      <span>R&amp;W {a.rwScore ?? "-"}</span>
                      <span aria-hidden>·</span>
                      <span>Math {a.mathScore ?? "-"}</span>
                      <span aria-hidden>·</span>
                      <span>{formatTaken(a.createdAt)}</span>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 flex-none text-navy/40 group-hover:text-navy" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <footer className="mx-auto w-full max-w-[860px] px-6 pb-10 text-center text-xs text-navy/40">
        1500 SAT Blueprint practice platform. Not affiliated with the College Board. SAT is a trademark of the College
        Board.
      </footer>
    </div>
  );
}
