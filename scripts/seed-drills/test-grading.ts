/** Live test of the AI grading pipeline. Replicates exactly what
 *  app/api/drills/grade/route.ts does (system = the drill's editable
 *  grading_prompt; user = question + critical path / key points + student text)
 *  and grades a STRONG vs WEAK answer so the differentiation is visible.
 *  Run: npx tsx scripts/seed-drills/test-grading.ts */
import * as fs from "node:fs";
import * as path from "node:path";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

function loadEnv(file: string) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv(path.resolve(".env.local"));

const MODEL = process.env.EXPLAIN_MODEL ?? "claude-opus-4-8";
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.SUPABASE_SECRET_KEY ?? "", {
  auth: { persistSession: false },
});
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

async function grade(system: string, user: string) {
  const resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: user }],
  });
  let text = "";
  for (const b of resp.content) if (b.type === "text") text += b.text;
  const s = text.indexOf("{"), e = text.lastIndexOf("}");
  return JSON.parse(text.slice(s, e + 1));
}

async function grammar() {
  const { data: drill } = await admin.from("drills").select("grading_prompt").eq("slug", "grammar").single();
  const { data: qs } = await admin
    .from("drill_questions")
    .select("id,stem,passage,content,drill_walkthrough_steps(position,kind,text,detail)")
    .eq("drill_slug", "grammar")
    .eq("status", "published")
    .limit(1);
  const q = qs![0];
  const c = q.content as { choices: { id: string; text: string }[]; correct: string };
  const steps = ((q.drill_walkthrough_steps ?? []) as { position: number; kind: string; text: string; detail?: string }[]).sort((a, b) => a.position - b.position);
  const choiceLines = c.choices.map((x) => `${x.id}. ${x.text}`).join("\n");
  const stepLines = steps.map((s, i) => `${i + 1}. [${s.kind}] ${s.text}${s.detail ? ` — ${s.detail}` : ""}`).join("\n");

  const strong = steps.map((s) => `${s.text}${s.detail ? `: ${s.detail}` : ""}`).join(" Then ");
  const weak = "I just picked the choice that sounded smoothest when I read it out loud. The others felt off but I couldn't say why.";

  const build = (studentText: string) =>
    [
      `Passage:\n${q.passage}`,
      `Question:\n${q.stem}`,
      `Choices:\n${choiceLines}`,
      `Correct answer: ${c.correct}`,
      `Critical-path steps (the ideal reasoning, in order):\n${stepLines}`,
      `Student's explanation:\n${studentText}`,
      'Return strict JSON only: {"score":0-100,"verdict":"<one line>","feedback":"<prose>","stepsMissed":["<step>", ...]}.',
    ].join("\n\n");

  console.log(`\n===== GRAMMAR (grade-process) — question ${q.id} =====`);
  console.log(`Stem: ${q.stem}`);
  const a = await grade(drill!.grading_prompt, build(strong));
  console.log(`\n[STRONG answer, follows the critical path]`);
  console.log(`  score=${a.score}  verdict="${a.verdict}"  stepsMissed=${a.stepsMissed?.length ?? 0}`);
  const b = await grade(drill!.grading_prompt, build(weak));
  console.log(`\n[WEAK answer, vague guess]`);
  console.log(`  score=${b.score}  verdict="${b.verdict}"  stepsMissed=${b.stepsMissed?.length ?? 0}`);
}

async function reading() {
  const { data: drill } = await admin.from("drills").select("grading_prompt").eq("slug", "reading").single();
  const { data: qs } = await admin
    .from("drill_questions")
    .select("id,content")
    .eq("drill_slug", "reading")
    .eq("status", "published")
    .limit(1);
  const q = qs![0];
  const c = q.content as { body: string[]; keyPoints: string[] };
  const points = c.keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n");

  const strong = c.keyPoints.join(" ");
  const weak = "It was about some science discovery, I think. I don't really remember the specifics.";

  const build = (studentText: string) =>
    [
      `Passage:\n${c.body.join("\n\n")}`,
      `Canonical key points (in order):\n${points}`,
      `Student's summary:\n${studentText}`,
      'Return strict JSON only: {"score":0-100,"verdict":"<one line>","captured":[{"text":"<key point>","captured":true|false}, ...]}.',
    ].join("\n\n");

  console.log(`\n===== READING (grade-summary) — question ${q.id} =====`);
  const a = await grade(drill!.grading_prompt, build(strong));
  const aCap = (a.captured ?? []).filter((x: { captured: boolean }) => x.captured).length;
  console.log(`\n[STRONG summary, recalls all key points]`);
  console.log(`  score=${a.score}  verdict="${a.verdict}"  captured=${aCap}/${c.keyPoints.length}`);
  const b = await grade(drill!.grading_prompt, build(weak));
  const bCap = (b.captured ?? []).filter((x: { captured: boolean }) => x.captured).length;
  console.log(`\n[WEAK summary, gist only]`);
  console.log(`  score=${b.score}  verdict="${b.verdict}"  captured=${bCap}/${c.keyPoints.length}`);
}

async function main() {
  await grammar();
  await reading();
  console.log("\n(Done. This runs the same Claude call + Scott's grading_prompt the live /api/drills/grade route uses.)");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
