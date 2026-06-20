import { notFound } from "next/navigation";
import { GrammarDrill } from "@/components/drills/grammar/GrammarDrill";
import { TargetedMathDrill } from "@/components/drills/math/TargetedMathDrill";
import { ReadingDrill } from "@/components/drills/reading/ReadingDrill";
import { WordScanDrill } from "@/components/drills/wordscan/WordScanDrill";
import { VocabDrill } from "@/components/drills/vocab/VocabDrill";
import { FlashcardsDrill } from "@/components/drills/flashcards/FlashcardsDrill";
import { AiMathDrill } from "@/components/drills/aimath/AiMathDrill";

// Next 16: route params and searchParams are async.
export default async function DrillPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  switch (slug) {
    case "grammar":
      return <GrammarDrill />;
    case "targeted-math":
      return <TargetedMathDrill difficulty={sp.difficulty === "hard" ? "hard" : "medium"} />;
    case "reading":
      return <ReadingDrill />;
    case "word-scan":
      return <WordScanDrill mode={sp.mode === "bad-mold" ? "bad-mold" : "ceased"} />;
    case "vocab":
      return <VocabDrill />;
    case "flashcards":
      return <FlashcardsDrill />;
    case "ai-math":
      return <AiMathDrill />;
    default:
      notFound();
  }
}
