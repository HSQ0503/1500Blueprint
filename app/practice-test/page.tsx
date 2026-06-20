import { TestRunner } from "@/components/test/TestRunner";
import { loadTest } from "@/lib/sat/loadTest";
import { sampleTest } from "@/lib/sat/sampleTest";

export const metadata = {
  title: "Practice Test — 1500 SAT Blueprint",
};

// Load the real test from Supabase; fall back to the dev fixture if unavailable.
export default async function PracticeTestPage() {
  const test = (await loadTest("practice-test-4")) ?? sampleTest;
  return <TestRunner test={test} />;
}
