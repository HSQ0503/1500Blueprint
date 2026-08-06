/**
 * Validate, AI-enrich, and import the alternate Practice Test 6 DOCX format.
 *
 *   npx tsx scripts/import/import-test6.ts "<test-6.docx>" [--dry-run] [--cache=<path>]
 *
 * AI is restricted to official SAT tags and exact LaTeX replacements. The
 * source's explanations are imported as human-authored content unchanged.
 */
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  auditTest6,
  enrichTest6Questions,
  parseTest6Docx,
  printTest6Report,
  TEST6_SKILLS_BY_DOMAIN,
  type Test6ParseResult,
  type Test6Question,
} from "./parse-test6";

function loadEnv(file: string) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

loadEnv(path.resolve(".env.local"));

const args = process.argv.slice(2);
const docxPath = args.find((arg) => !arg.startsWith("--"));
const dryRun = args.includes("--dry-run");
const cacheArg = args.find((arg) => arg.startsWith("--cache="))?.slice("--cache=".length);
const slug = "practice-test-6";
const title = "Practice Test 6";
const bucket = "figures";
const minutes: Record<string, number> = { rw: 32, math: 35 };

if (!docxPath) {
  console.error('Usage: tsx scripts/import/import-test6.ts "<test-6.docx>" [--dry-run] [--cache=<path>]');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseSecret = process.env.SUPABASE_SECRET_KEY ?? "";
const anthropicKey = process.env.ANTHROPIC_API_KEY ?? "";
const model = process.env.TEST6_ENRICH_MODEL ?? "claude-opus-4-8";

type UploadedImage = { objectPath: string; url: string };

function sha256(value: Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function validateParsed(result: Test6ParseResult, enriched: boolean): void {
  const audit = auditTest6(result);
  const questions = result.modules.flatMap((module) => module.questions);
  const missingAnswers = questions.filter((question) =>
    question.type === "mc" ? !question.correct : question.acceptedAnswers.length === 0,
  );
  const unexpectedFlags = audit.flagged.filter(
    (question) =>
      !(
        ["math/2/hard/19", "math/2/hard/22"].includes(question.key) &&
        question.notes.length === 1 &&
        question.notes[0] === "missing supplied explanation"
      ),
  );

  const errors = [...audit.errors];
  if (audit.questionCount !== 147) errors.push(`expected 147 questions, found ${audit.questionCount}`);
  if (audit.imageCount !== 10 || audit.referencedImages !== 10) errors.push("expected 10 referenced source images");
  if (audit.tableCount !== 7) errors.push(`expected 7 tables, found ${audit.tableCount}`);
  if (audit.explanationCount !== 145) errors.push(`expected 145 supplied explanations, found ${audit.explanationCount}`);
  if (missingAnswers.length) errors.push(`missing answers: ${missingAnswers.map((question) => question.key).join(", ")}`);
  if (unexpectedFlags.length) errors.push(`questions need review: ${unexpectedFlags.map((question) => question.key).join(", ")}`);
  if (enriched && audit.taggedCount !== 147) errors.push(`expected 147 AI tags, found ${audit.taggedCount}`);
  if (enriched) {
    for (const question of questions) {
      if (!question.domain || !question.skill || !TEST6_SKILLS_BY_DOMAIN[question.domain]?.includes(question.skill)) {
        errors.push(`invalid taxonomy: ${question.key}`);
      }
    }
  }
  if (errors.length) throw new Error(`Test 6 validation failed:\n- ${errors.join("\n- ")}`);
}

async function ensureBucket(): Promise<void> {
  const { data, error } = await supabase.storage.getBucket(bucket);
  if (error && !/not found/i.test(error.message)) throw error;
  if (data) return;
  const { error: createError } = await supabase.storage.createBucket(bucket, { public: true });
  if (createError && !/already exists/i.test(createError.message)) throw createError;
}

async function uploadAndVerifyImages(
  images: Test6ParseResult["images"],
): Promise<Map<string, UploadedImage>> {
  const uploaded = new Map<string, UploadedImage>();
  for (const [name, image] of images) {
    const hash = sha256(image.buffer);
    const extension = name.split(".").pop() || "png";
    const objectPath = `${slug}/${hash.slice(0, 24)}.${extension}`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(objectPath, image.buffer, { contentType: image.contentType, upsert: true });
    if (error) throw error;
    const url = supabase.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`uploaded image is not publicly readable: ${name} (${response.status})`);
    const downloaded = Buffer.from(await response.arrayBuffer());
    if (sha256(downloaded) !== hash) throw new Error(`uploaded image bytes do not match source: ${name}`);
    uploaded.set(name, { objectPath, url });
  }
  return uploaded;
}

function imageUrl(question: Test6Question, uploaded: Map<string, UploadedImage>): string | null {
  if (!question.figure) return null;
  const image = uploaded.get(question.figure);
  if (!image) throw new Error(`no uploaded URL for ${question.figure}`);
  return image.url;
}

async function writeDatabase(result: Test6ParseResult, uploaded: Map<string, UploadedImage>): Promise<string> {
  const { data: test, error: testError } = await supabase
    .from("tests")
    .upsert(
      {
        slug,
        title,
        source_file: path.basename(docxPath as string),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();
  if (testError) throw testError;

  const { error: deleteError } = await supabase.from("modules").delete().eq("test_id", test.id);
  if (deleteError) throw deleteError;

  for (const testModule of result.modules) {
    const { data: moduleRow, error: moduleError } = await supabase
      .from("modules")
      .insert({
        test_id: test.id,
        section: testModule.section,
        order: testModule.order,
        variant: testModule.variant ?? "m1",
        minutes_per_module: minutes[testModule.section],
        label: testModule.label,
      })
      .select("id")
      .single();
    if (moduleError) throw moduleError;

    const questionRows = testModule.questions.map((question) => ({
      module_id: moduleRow.id,
      position: question.position,
      type: question.type,
      domain: question.domain,
      skill: question.skill,
      difficulty: question.difficulty,
      passage: question.passage,
      prompt: question.prompt,
      figure_url: imageUrl(question, uploaded),
      correct: question.correct,
      accepted_answers: question.acceptedAnswers,
      explanation: question.explanation,
      explanation_source: question.explanationSource,
      needs_review: question.needsReview,
    }));
    const { data: insertedQuestions, error: questionError } = await supabase
      .from("questions")
      .insert(questionRows)
      .select("id,position");
    if (questionError) throw questionError;

    const idByPosition = new Map((insertedQuestions ?? []).map((question) => [question.position, question.id]));
    const choiceRows = testModule.questions.flatMap((question) => {
      const questionId = idByPosition.get(question.position);
      if (!questionId) throw new Error(`missing inserted question id for ${question.key}`);
      return question.choices.map((choice) => ({
        question_id: questionId,
        letter: choice.letter,
        text: choice.text,
        explanation: choice.explanation,
      }));
    });
    if (choiceRows.length) {
      const { error: choiceError } = await supabase.from("choices").insert(choiceRows);
      if (choiceError) throw choiceError;
    }
  }
  return test.id;
}

async function verifyDatabase(testId: string): Promise<void> {
  const { data: modules, error: moduleError } = await supabase
    .from("modules")
    .select("id")
    .eq("test_id", testId);
  if (moduleError) throw moduleError;
  if (modules?.length !== 6) throw new Error(`production verification found ${modules?.length ?? 0} modules`);

  const moduleIds = modules.map((module) => module.id);
  const { data: questions, error: questionError } = await supabase
    .from("questions")
    .select("id,domain,skill,figure_url,passage,explanation,explanation_source")
    .in("module_id", moduleIds);
  if (questionError) throw questionError;
  if (questions?.length !== 147) throw new Error(`production verification found ${questions?.length ?? 0} questions`);
  if (questions.filter((question) => question.figure_url).length !== 10) throw new Error("production verification did not find 10 figures");
  if (questions.filter((question) => question.passage?.includes("@@ROW@@")).length !== 7) {
    throw new Error("production verification did not find 7 native tables");
  }
  if (questions.filter((question) => question.explanation && question.explanation_source === "human").length !== 145) {
    throw new Error("production verification did not find 145 human explanations");
  }
  if (questions.some((question) => !question.domain || !question.skill)) throw new Error("production verification found an untagged question");

  const { count, error: choiceError } = await supabase
    .from("choices")
    .select("id", { count: "exact", head: true })
    .in("question_id", questions.map((question) => question.id));
  if (choiceError) throw choiceError;
  if (count !== 524) throw new Error(`production verification found ${count ?? 0} choices instead of 524`);
}

const supabase = createClient(supabaseUrl, supabaseSecret, { auth: { persistSession: false } });

async function main(): Promise<void> {
  if (!fs.existsSync(docxPath as string)) throw new Error(`DOCX not found: ${docxPath}`);
  const sourceHash = sha256(fs.readFileSync(docxPath as string)).slice(0, 12);
  const cachePath = cacheArg || path.join(os.tmpdir(), `practice-test-6-${sourceHash}-enrichment.json`);

  console.log("Parsing Test 6 source…");
  const result = await parseTest6Docx(docxPath as string);
  validateParsed(result, false);

  console.log(`AI-tagging and normalizing LaTeX with ${model}…`);
  await enrichTest6Questions(result.modules, {
    apiKey: anthropicKey,
    model,
    cachePath,
    batchSize: 4,
    concurrency: 3,
  });
  const audit = printTest6Report(result);
  validateParsed(result, true);

  const enrichedOutput = path.join(os.tmpdir(), `practice-test-6-${sourceHash}-enriched.json`);
  fs.writeFileSync(enrichedOutput, JSON.stringify(result.modules, null, 2));
  console.log(`Validated enrichment: ${audit.latexReplacementCount} LaTeX replacements`);
  console.log(`Enriched audit file: ${enrichedOutput}`);
  if (dryRun) {
    console.log("[dry-run] Production was not changed.");
    return;
  }
  if (!supabaseUrl || !supabaseSecret) throw new Error("Supabase URL and secret key are required for upload");

  console.log("Uploading and byte-verifying 10 source images…");
  await ensureBucket();
  const uploaded = await uploadAndVerifyImages(result.images);

  console.log("Writing Practice Test 6 to production…");
  const testId = await writeDatabase(result, uploaded);
  await verifyDatabase(testId);
  console.log("Imported and verified Practice Test 6: 6 modules, 147 questions, 524 choices, 10 images, 7 tables.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
