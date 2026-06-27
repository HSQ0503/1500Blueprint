import { notFound } from "next/navigation";
import { TestRunner } from "@/components/test/TestRunner";
import { loadTest } from "@/lib/sat/loadTest";
import { loadTestSession } from "@/lib/sat/testSession";
import { getSession } from "@/lib/auth/session";

export const metadata = {
  title: "Practice Test · 1500 SAT Blueprint",
};

// Next 16: route params are async.
export default async function RunTestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const test = await loadTest(slug);
  if (!test) notFound();
  const session = await getSession();
  const devMode = process.env.NODE_ENV !== "production" && session?.plan === "dev";
  // An in-progress session lets the intro offer "Resume where you left off".
  const resumeState = session ? await loadTestSession(session.email, slug) : null;
  return <TestRunner test={test} slug={slug} devMode={devMode} resumeState={resumeState} />;
}
