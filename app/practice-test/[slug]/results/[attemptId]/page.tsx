import { notFound, redirect } from "next/navigation";
import { ResultsScreen } from "@/components/test/ResultsScreen";
import { loadTest } from "@/lib/sat/loadTest";
import { scoreTest } from "@/lib/sat/scoring";
import { getSession } from "@/lib/auth/session";
import { getTestAttempt } from "@/lib/gamification/state";

export const metadata = {
  title: "Your results · 1500 SAT Blueprint",
};

function formatTaken(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Next 16: route params are async. Read-only review of a saved attempt; it
// recomputes the report from stored data and never awards anything.
export default async function AttemptResultsPage({
  params,
}: {
  params: Promise<{ slug: string; attemptId: string }>;
}) {
  const { slug, attemptId } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  // getTestAttempt filters by email, so a student can only open their own attempts.
  const attempt = await getTestAttempt(session.email, attemptId);
  if (!attempt || attempt.testSlug !== slug) notFound();

  const test = await loadTest(slug);
  if (!test) notFound();

  // scoreTest is pure, so stored answers + routed variants reproduce the exact
  // report, assuming the published form is unchanged since the attempt. Editing a
  // live form in the CMS after attempts exist would shift this recompute; freeze or
  // version forms that already have attempts if that becomes a real workflow.
  const result = scoreTest(test, attempt.routed, attempt.answers);

  return (
    <ResultsScreen
      test={test}
      result={result}
      routed={attempt.routed}
      answers={attempt.answers}
      perQuestionTime={attempt.perQuestionTime}
      backHref={`/practice-test/${slug}/attempts`}
      attemptDate={formatTaken(attempt.createdAt)}
    />
  );
}
