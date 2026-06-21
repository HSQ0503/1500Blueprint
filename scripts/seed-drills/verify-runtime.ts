/** Verify the RUNTIME path: read published drill questions with the ANON
 *  (publishable) key under RLS — exactly what the student drill pages use.
 *  Run: npx tsx scripts/seed-drills/verify-runtime.ts */
import * as fs from "node:fs";
import * as path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv(file: string) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv(path.resolve(".env.local"));

// ANON key — the same client the browser/runtime uses (lib/drills/loadDrillContent.ts).
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  { auth: { persistSession: false } },
);

async function main() {
  console.log("Published drill questions readable with the ANON key (RLS):\n");
  for (const slug of ["grammar", "targeted-math", "vocab", "flashcards", "reading", "word-scan", "ai-math"]) {
    const { count, error } = await supabase
      .from("drill_questions")
      .select("*", { count: "exact", head: true })
      .eq("drill_slug", slug)
      .eq("status", "published");
    console.log(`  ${String(count ?? 0).padStart(4)}  ${slug}${error ? `  (error: ${error.message})` : ""}`);
  }

  // Confirm a draft would NOT be visible to anon (RLS sanity).
  const { count: drafts } = await supabase
    .from("drill_questions")
    .select("*", { count: "exact", head: true })
    .eq("status", "draft");
  console.log(`\n  drafts visible to anon (should be 0): ${drafts ?? 0}`);

  // Math sample — problem text should now be in stem.
  const { data: math } = await supabase
    .from("drill_questions")
    .select("id,stem,passage,content")
    .eq("drill_slug", "targeted-math")
    .eq("status", "published")
    .limit(1);
  console.log(`\nMATH sample: stem="${math?.[0]?.stem?.slice(0, 90)}…" passage=${JSON.stringify(math?.[0]?.passage)}`);

  // Grammar sample — confirm walkthrough steps come through the RLS join.
  const { data: gram } = await supabase
    .from("drill_questions")
    .select("id,stem,drill_walkthrough_steps(position,kind,text)")
    .eq("drill_slug", "grammar")
    .eq("status", "published")
    .limit(1);
  const steps = (gram?.[0]?.drill_walkthrough_steps ?? []) as { position: number; kind: string; text: string }[];
  console.log(`GRAMMAR sample: ${steps.length} walkthrough steps readable via anon join`);

  // Reading sample — key points present.
  const { data: read } = await supabase
    .from("drill_questions")
    .select("id,content")
    .eq("drill_slug", "reading")
    .eq("status", "published")
    .limit(1);
  const kp = (read?.[0]?.content as { keyPoints?: string[] } | null)?.keyPoints ?? [];
  console.log(`READING sample: ${kp.length} key points`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
