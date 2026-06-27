import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { loadTest } from "@/lib/sat/loadTest";
import { getModuleByKey } from "@/lib/sat/modules";
import { getModuleAttempt } from "@/lib/sat/moduleAttempts";
import { ModuleResults } from "@/components/test/ModuleResults";

export const metadata = {
  title: "Module result · 1500 SAT Blueprint",
};

function formatTaken(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Read-only review of a saved module attempt (recomputes the per-question review
// from stored answers). getModuleAttempt filters by email, so a student can only
// open their own.
export default async function ModuleAttemptResultsPage({
  params,
}: {
  params: Promise<{ slug: string; key: string; attemptId: string }>;
}) {
  const { slug, key, attemptId } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const attempt = await getModuleAttempt(session.email, attemptId);
  if (!attempt || attempt.testSlug !== slug || attempt.moduleKey !== key) notFound();

  const test = await loadTest(slug);
  if (!test) notFound();
  const found = getModuleByKey(test, key);
  if (!found) notFound();

  const timeUsed = Object.values(attempt.perQuestionTime).reduce((a, b) => a + b, 0);

  return (
    <ModuleResults
      meta={found.meta}
      module={found.module}
      answers={attempt.answers}
      perQuestionTime={attempt.perQuestionTime}
      timeUsedSeconds={timeUsed}
      slug={slug}
      attemptDate={formatTaken(attempt.createdAt)}
      backHref={`/practice-test/${slug}/attempts`}
    />
  );
}
