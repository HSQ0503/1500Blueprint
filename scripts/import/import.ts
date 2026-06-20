/**
 * Import a practice-test .docx into Supabase.
 *
 *   npx tsx scripts/import/import.ts "<path.docx>" <slug> "<title>" [--no-ai] [--dry-run]
 *
 * Steps: parse → upload figures to Storage (deduped) → AI-draft per-choice
 * explanations → upsert tests/modules/questions/choices. Idempotent (re-runs
 * replace the test's modules via cascade). Uses the service-role (secret) key.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { parseDocx, printReport, type ParsedQuestion } from "./parse";

// --- minimal .env.local loader (no dep) ---
function loadEnv(file: string) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv(path.resolve(".env.local"));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SECRET = process.env.SUPABASE_SECRET_KEY ?? "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const MODEL = process.env.EXPLAIN_MODEL ?? "claude-opus-4-8";
const BUCKET = "figures";
const MINUTES: Record<string, number> = { rw: 32, math: 35 };

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const positional = args.filter((a) => !a.startsWith("--"));
const docxPath = positional[0];
const slug = positional[1] ?? "practice-test";
const title = positional[2] ?? slug;
const dryRun = flags.has("--dry-run");
const useAI = !flags.has("--no-ai") && !!ANTHROPIC_KEY;

if (!docxPath) {
  console.error('Usage: tsx scripts/import/import.ts "<docx>" <slug> "<title>" [--no-ai] [--dry-run]');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SECRET, { auth: { persistSession: false } });
const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;

async function ensureBucket() {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (!data) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error && !/already exists/i.test(error.message)) throw error;
  }
}

// Upload each image once (deduped by content hash); return mammoth-name → public URL.
async function uploadImages(images: Map<string, { buffer: Buffer; contentType: string }>) {
  const urlByName = new Map<string, string>();
  const urlByHash = new Map<string, string>();
  for (const [name, img] of images) {
    const hash = crypto.createHash("sha256").update(img.buffer).digest("hex").slice(0, 24);
    let url = urlByHash.get(hash);
    if (!url) {
      const ext = name.split(".").pop() || "png";
      const objectPath = `${slug}/${hash}.${ext}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(objectPath, img.buffer, { contentType: img.contentType, upsert: true });
      if (error) throw error;
      url = supabase.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
      urlByHash.set(hash, url);
    }
    urlByName.set(name, url);
  }
  return urlByName;
}

type Explanation = { explanation: string; choices: Record<string, string> };

async function explain(q: ParsedQuestion): Promise<Explanation | null> {
  if (!anthropic) return null;
  const choiceLines = q.choices.map((c) => `${c.letter}. ${c.text}`).join("\n");
  const answer = q.type === "mc" ? q.correct : q.acceptedAnswers.join(" or ");
  const user = [
    q.passage ? `Passage/stimulus:\n${q.passage}\n` : "",
    `Question: ${q.prompt}`,
    q.choices.length ? `Choices:\n${choiceLines}` : "",
    `Correct answer: ${answer}`,
    "",
    q.type === "mc"
      ? `Return ONLY this JSON: {"explanation":"why the correct answer is correct (2-3 sentences)","choices":{"A":"why A is right/wrong (1 sentence)","B":"...","C":"...","D":"..."}}`
      : `Return ONLY this JSON: {"explanation":"how to reach the correct answer (2-4 sentences)"}`,
  ]
    .filter(Boolean)
    .join("\n");

  const resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system:
      "You are an expert digital-SAT tutor. Write concise, student-facing explanations. Output only a single JSON object — no prose, no markdown fences.",
    messages: [{ role: "user", content: user }],
  });

  let text = "";
  for (const block of resp.content) if (block.type === "text") text += block.text;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    return {
      explanation: String(parsed.explanation ?? ""),
      choices: (parsed.choices ?? {}) as Record<string, string>,
    };
  } catch {
    return null;
  }
}

// Run async fn over items with a concurrency cap.
async function pool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) await fn(items[i++]);
    }),
  );
}

async function main() {
  const { modules, images } = await parseDocx(docxPath);
  printReport(slug, modules, images.size);
  if (dryRun) {
    console.log("\n[dry-run] no writes performed");
    return;
  }

  console.log("\nUploading figures to Storage…");
  await ensureBucket();
  const urlByName = await uploadImages(images);
  console.log(`  ${urlByName.size} refs → ${new Set(urlByName.values()).size} unique objects`);

  const allQuestions = modules.flatMap((m) => m.questions);
  const explanations = new Map<ParsedQuestion, Explanation | null>();
  if (useAI) {
    console.log(`Generating explanations for ${allQuestions.length} questions with ${MODEL}…`);
    let done = 0;
    await pool(allQuestions, 5, async (q) => {
      explanations.set(q, await explain(q));
      if (++done % 20 === 0 || done === allQuestions.length) {
        console.log(`  ${done}/${allQuestions.length}`);
      }
    });
  } else {
    console.log("Skipping AI explanations (--no-ai or no ANTHROPIC_API_KEY).");
  }

  console.log("Writing to database…");
  const { data: test, error: testErr } = await supabase
    .from("tests")
    .upsert(
      { slug, title, source_file: path.basename(docxPath), updated_at: new Date().toISOString() },
      { onConflict: "slug" },
    )
    .select()
    .single();
  if (testErr) throw testErr;
  if (!test) throw new Error("tests upsert returned no row");

  // Idempotency: wipe this test's modules (cascades to questions + choices).
  await supabase.from("modules").delete().eq("test_id", test.id);

  let qCount = 0;
  let cCount = 0;
  for (const mod of modules) {
    const { data: moduleRow, error: mErr } = await supabase
      .from("modules")
      .insert({
        test_id: test.id,
        section: mod.section,
        order: mod.order,
        variant: mod.variant ?? "m1",
        minutes_per_module: MINUTES[mod.section] ?? 32,
        label: mod.label,
      })
      .select()
      .single();
    if (mErr) throw mErr;
    if (!moduleRow) throw new Error("module insert returned no row");

    const qRows = mod.questions.map((q) => {
      const e = explanations.get(q) ?? null;
      return {
        module_id: moduleRow.id,
        position: q.position,
        type: q.type,
        domain: q.domain,
        skill: q.skill,
        difficulty: q.difficulty,
        passage: q.passage,
        prompt: q.prompt,
        figure_url: q.figure ? (urlByName.get(q.figure) ?? null) : null,
        correct: q.correct,
        accepted_answers: q.acceptedAnswers,
        explanation: e?.explanation ?? null,
        explanation_source: e ? "ai" : null,
        needs_review: q.needsReview || (useAI && e === null),
      };
    });
    const { data: insertedQ, error: qErr } = await supabase.from("questions").insert(qRows).select();
    if (qErr) throw qErr;
    qCount += insertedQ?.length ?? 0;

    const idByPosition = new Map<number, string>((insertedQ ?? []).map((r) => [r.position, r.id]));
    const cRows: { question_id: string; letter: string; text: string; explanation: string | null }[] = [];
    for (const q of mod.questions) {
      const e = explanations.get(q);
      const qid = idByPosition.get(q.position);
      if (!qid) continue;
      for (const c of q.choices) {
        cRows.push({ question_id: qid, letter: c.letter, text: c.text, explanation: e?.choices?.[c.letter] ?? null });
      }
    }
    if (cRows.length) {
      const { error: cErr } = await supabase.from("choices").insert(cRows);
      if (cErr) throw cErr;
      cCount += cRows.length;
    }
  }

  console.log(
    `\n✓ Imported "${title}" (slug: ${slug}) — ${modules.length} modules, ${qCount} questions, ${cCount} choices.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
