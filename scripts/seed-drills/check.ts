/** Print one seeded drill question per drill (content + walkthrough) to eyeball
 *  AI quality. Run: npx tsx scripts/seed-drills/check.ts */
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
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.SUPABASE_SECRET_KEY ?? "", {
  auth: { persistSession: false },
});

async function main() {
  for (const slug of ["grammar", "targeted-math", "vocab", "flashcards", "reading"]) {
    const { data } = await supabase
      .from("drill_questions")
      .select("id,skill,difficulty,answer_type,stem,passage,content,explanation,status")
      .eq("drill_slug", slug)
      .eq("created_by", "seed:practice-tests")
      .limit(1);
    const q = data?.[0];
    console.log(`\n================= ${slug.toUpperCase()} =================`);
    if (!q) {
      console.log("  (none)");
      continue;
    }
    console.log(`id=${q.id} skill=${q.skill} diff=${q.difficulty} type=${q.answer_type} status=${q.status}`);
    if (q.stem) console.log(`stem: ${q.stem}`);
    if (q.passage) console.log(`passage: ${q.passage.slice(0, 220)}${q.passage.length > 220 ? "…" : ""}`);
    console.log(`content: ${JSON.stringify(q.content, null, 2)}`);
    if (q.explanation) console.log(`explanation: ${q.explanation.slice(0, 240)}`);
    const { data: steps } = await supabase
      .from("drill_walkthrough_steps")
      .select("position,kind,text,detail")
      .eq("question_id", q.id)
      .order("position");
    if (steps?.length) {
      console.log("walkthrough:");
      for (const s of steps) console.log(`  ${s.position}. [${s.kind}] ${s.text}${s.detail ? ` — ${s.detail}` : ""}`);
    }
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
