import { notFound } from "next/navigation";
import { TestRunner } from "@/components/test/TestRunner";
import { loadTest } from "@/lib/sat/loadTest";

export const metadata = {
  title: "Practice Test — 1500 SAT Blueprint",
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
  return <TestRunner test={test} />;
}
