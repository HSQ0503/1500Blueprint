/**
 * Prefill drill_questions from the practice-test bank.
 *
 *   npx tsx scripts/seed-drills/seed.ts [--dry-run] [--limit N] [--drills=grammar,targeted-math,vocab,flashcards,reading]
 *
 * - grammar       <- RW Standard English Conventions (mc)  + AI critical path
 * - targeted-math <- Math grid-in                          + AI critical path
 * - vocab         <- RW Words in Context (mc)              + AI definition/pos
 * - flashcards    <- distinct vocab words                  + AI def/example
 * - reading       <- substantive RW comprehension passages + AI key points
 *
 * Idempotent: every row has a deterministic id derived from its source, upserted
 * on id; walkthrough steps are delete-then-insert per question. Re-running
 * refreshes content without creating duplicates and without touching questions
 * authored by hand in the CMS (those have uuid ids). Uses the service-role key.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { canonicalDomain, canonicalSkill } from "./skills";

function loadEnv(file: string) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv(path.resolve(".env.local"));

const MODEL = process.env.EXPLAIN_MODEL ?? "claude-opus-4-8";
const CONCURRENCY = 8;
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SECRET_KEY ?? "",
  { auth: { persistSession: false } },
);
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith("--")));
const dryRun = flags.has("--dry-run");
const limitArg = [...flags].find((f) => f.startsWith("--limit"));
const LIMIT = limitArg ? Number(limitArg.split(/[=\s]/)[1] ?? process.argv[process.argv.indexOf(limitArg) + 1]) : Infinity;
const drillsArg = [...flags].find((f) => f.startsWith("--drills="));
const ONLY = drillsArg ? new Set(drillsArg.split("=")[1].split(",")) : null;
const want = (slug: string) => !ONLY || ONLY.has(slug);

const SEED_BY = "seed:practice-tests";

// --- source rows -----------------------------------------------------------

type Choice = { letter: string; text: string };
type Q = {
  id: string;
  type: "mc" | "grid";
  domain: string | null;
  skill: string | null;
  difficulty: string | null;
  passage: string | null;
  prompt: string;
  figure_url: string | null;
  correct: string | null;
  accepted_answers: string[] | null;
  explanation: string | null;
  modules: { section: string } | { section: string }[] | null;
  choices: Choice[] | null;
};

function section(q: Q): string {
  const m = q.modules;
  return Array.isArray(m) ? (m[0]?.section ?? "?") : (m?.section ?? "?");
}
function difficulty(q: Q): "easy" | "medium" | "hard" {
  const d = (q.difficulty ?? "").toLowerCase();
  return d === "easy" || d === "hard" ? d : "medium";
}
function sortedChoices(q: Q): Choice[] {
  return [...(q.choices ?? [])].sort((a, b) => a.letter.localeCompare(b.letter));
}

async function fetchQuestions(): Promise<Q[]> {
  const all: Q[] = [];
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("questions")
      .select(
        "id,type,domain,skill,difficulty,passage,prompt,figure_url,correct,accepted_answers,explanation," +
          "modules(section),choices(letter,text)",
      )
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as unknown as Q[]));
    if (data.length < pageSize) break;
  }
  return all;
}

// --- AI generation ---------------------------------------------------------

async function callJson<T>(system: string, user: string, maxTokens = 900): Promise<T | null> {
  if (!anthropic) return null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const resp = await anthropic.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      });
      let text = "";
      for (const b of resp.content) if (b.type === "text") text += b.text;
      const s = text.indexOf("{");
      const e = text.lastIndexOf("}");
      if (s >= 0 && e > s) return JSON.parse(text.slice(s, e + 1)) as T;
    } catch {
      // retry once
    }
  }
  return null;
}

type StepGen = { kind: "normal" | "confirm_option"; text: string; detail?: string };

async function criticalPath(q: Q, subject: "grammar" | "math"): Promise<StepGen[]> {
  const choiceLines = sortedChoices(q).map((c) => `${c.letter}. ${c.text}`).join("\n");
  const answer = q.type === "mc" ? (q.correct ?? "") : (q.accepted_answers ?? []).join(" or ");
  const user = [
    q.passage ? `Passage/stimulus:\n${q.passage}\n` : "",
    `Question: ${q.prompt}`,
    choiceLines ? `Choices:\n${choiceLines}` : "",
    `Correct answer: ${answer}`,
    q.explanation ? `Reference explanation: ${q.explanation}` : "",
    "",
    'Return ONLY JSON: {"steps":[{"kind":"normal","text":"<short imperative step, 3-9 words>","detail":"<one sentence on what to check/do>"}]}.',
    "Give 3-6 steps in the exact order an expert solves it. Steps describe the REASONING/PROCESS (not the answer letter).",
    'The FINAL step must have kind "confirm_option" and confirm choosing the correct answer.',
  ]
    .filter(Boolean)
    .join("\n");
  const system = `You are an expert digital-SAT ${subject === "grammar" ? "grammar" : "math"} tutor. You output the CRITICAL PATH: the ordered reasoning steps to solve the item. Output only one JSON object, no prose, no markdown.`;
  const out = await callJson<{ steps: StepGen[] }>(system, user);
  const steps = Array.isArray(out?.steps) ? out!.steps : [];
  return steps
    .filter((s) => s && typeof s.text === "string" && s.text.trim())
    .map((s, i, arr) => ({
      kind: i === arr.length - 1 ? "confirm_option" : s.kind === "confirm_option" ? "normal" : "normal",
      text: s.text.trim(),
      detail: typeof s.detail === "string" && s.detail.trim() ? s.detail.trim() : undefined,
    }));
}

async function readingKeyPoints(passage: string): Promise<string[]> {
  const out = await callJson<{ keyPoints: string[] }>(
    "You are an expert digital-SAT reading tutor. Output only one JSON object, no prose.",
    `Passage:\n${passage}\n\nReturn ONLY JSON: {"keyPoints":["<concise key point>", ...]}. Give 4-6 key points a strong reader should recall, in passage order, central ideas first. Each is one short sentence.`,
  );
  return Array.isArray(out?.keyPoints) ? out!.keyPoints.filter((k) => typeof k === "string" && k.trim()).map((k) => k.trim()) : [];
}

async function vocabInfo(word: string, context: string): Promise<{ pos: string; definition: string } | null> {
  const out = await callJson<{ pos: string; definition: string }>(
    "You are a lexicographer for SAT prep. Output only one JSON object.",
    `Word: "${word}"\nContext sentence (the word fits this blank): ${context}\n\nReturn ONLY JSON: {"pos":"adj.|n.|v.|adv.","definition":"<concise definition, <=14 words, of the word as used>"}.`,
    300,
  );
  if (!out || typeof out.definition !== "string" || !out.definition.trim()) return null;
  return { pos: (out.pos ?? "").trim(), definition: out.definition.trim() };
}

async function flashcardInfo(word: string): Promise<{ pos: string; definition: string; example: string } | null> {
  const out = await callJson<{ pos: string; definition: string; example: string }>(
    "You are a lexicographer for SAT prep. Output only one JSON object.",
    `Word: "${word}"\n\nReturn ONLY JSON: {"pos":"adj.|n.|v.|adv.","definition":"<concise definition>","example":"<one natural example sentence using the word>"}.`,
    350,
  );
  if (!out || typeof out.definition !== "string" || !out.definition.trim()) return null;
  return {
    pos: (out.pos ?? "").trim(),
    definition: out.definition.trim(),
    example: typeof out.example === "string" ? out.example.trim() : "",
  };
}

// Run async fn over items with a concurrency cap + progress log.
async function pool<T>(label: string, items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let i = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const item = items[i++];
        await fn(item);
        if (++done % 20 === 0 || done === items.length) console.log(`  ${label}: ${done}/${items.length}`);
      }
    }),
  );
}

// --- row shapes ------------------------------------------------------------

type DrillRow = {
  id: string;
  drill_slug: string;
  section: string | null;
  domain: string | null;
  skill: string | null;
  difficulty: string;
  answer_type: string;
  stem: string | null;
  passage: string | null;
  figure_url: string | null;
  content: Record<string, unknown>;
  explanation: string | null;
  status: string;
  created_by: string;
};
type StepRow = { question_id: string; position: number; kind: string; text: string; detail: string | null };

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
const take = <T,>(arr: T[]) => (LIMIT === Infinity ? arr : arr.slice(0, LIMIT));

async function main() {
  console.log(`Fetching practice-test questions…`);
  const qs = await fetchQuestions();
  console.log(`  ${qs.length} questions`);
  if (!anthropic && !dryRun) {
    console.error("ANTHROPIC_API_KEY missing — needed for explanations/critical paths. Aborting.");
    process.exit(1);
  }

  const rows: DrillRow[] = [];
  const steps: StepRow[] = [];

  // ---- Grammar: RW Standard English Conventions, mc ----
  if (want("grammar")) {
    const cand = take(
      qs.filter(
        (q) =>
          section(q) === "rw" &&
          canonicalDomain(q.domain) === "Standard English Conventions" &&
          q.type === "mc" &&
          q.correct &&
          (q.choices?.length ?? 0) >= 2,
      ),
    );
    console.log(`\nGrammar candidates: ${cand.length}`);
    if (!dryRun) {
      await pool("grammar", cand, CONCURRENCY, async (q) => {
        const id = `g-${q.id}`;
        rows.push({
          id,
          drill_slug: "grammar",
          section: "rw",
          domain: "Standard English Conventions",
          skill: canonicalSkill(q.skill),
          difficulty: difficulty(q),
          answer_type: "mc_single",
          stem: q.prompt,
          passage: q.passage,
          figure_url: q.figure_url,
          content: {
            pattern: canonicalSkill(q.skill) ?? undefined,
            choices: sortedChoices(q).map((c) => ({ id: c.letter, text: c.text })),
            correct: q.correct,
          },
          explanation: q.explanation,
          status: "published",
          created_by: SEED_BY,
        });
        const cp = await criticalPath(q, "grammar");
        cp.forEach((s, idx) => steps.push({ question_id: id, position: idx + 1, kind: s.kind, text: s.text, detail: s.detail ?? null }));
      });
    }
  }

  // ---- Targeted math: Math grid-in ----
  if (want("targeted-math")) {
    const cand = take(qs.filter((q) => section(q) === "math" && q.type === "grid"));
    console.log(`\nTargeted-math candidates: ${cand.length}`);
    if (!dryRun) {
      await pool("targeted-math", cand, CONCURRENCY, async (q) => {
        const id = `tm-${q.id}`;
        rows.push({
          id,
          drill_slug: "targeted-math",
          section: "math",
          domain: canonicalDomain(q.domain) ?? q.domain,
          skill: canonicalSkill(q.skill),
          difficulty: difficulty(q),
          answer_type: "grid_in",
          // The real problem text is in the source passage (the prompt is a
          // generic "SPR" label); store it in stem to match the editor convention.
          stem: q.passage?.trim() ? q.passage : q.prompt,
          passage: null,
          figure_url: q.figure_url,
          content: { accepted: q.accepted_answers ?? [] },
          explanation: q.explanation,
          status: "published",
          created_by: SEED_BY,
        });
        const cp = await criticalPath(q, "math");
        cp.forEach((s, idx) => steps.push({ question_id: id, position: idx + 1, kind: s.kind, text: s.text, detail: s.detail ?? null }));
      });
    }
  }

  // ---- Vocab: RW Words in Context, mc ----
  const vocabWords = new Map<string, string>(); // word -> context, for flashcards
  if (want("vocab") || want("flashcards")) {
    const cand = take(
      qs.filter(
        (q) =>
          section(q) === "rw" &&
          canonicalSkill(q.skill) === "Words in Context" &&
          q.type === "mc" &&
          q.correct &&
          (q.choices?.length ?? 0) >= 2,
      ),
    );
    console.log(`\nVocab candidates: ${cand.length}`);
    if (!dryRun) {
      await pool("vocab", cand, CONCURRENCY, async (q) => {
        const sorted = sortedChoices(q);
        const correctIndex = sorted.findIndex((c) => c.letter === q.correct);
        const word = sorted[correctIndex]?.text?.trim();
        if (correctIndex < 0 || !word) return;
        const info = await vocabInfo(word, q.passage ?? q.prompt);
        if (!info) return;
        if (!vocabWords.has(word.toLowerCase())) vocabWords.set(word.toLowerCase(), word);
        if (want("vocab")) {
          rows.push({
            id: `v-${q.id}`,
            drill_slug: "vocab",
            section: "rw",
            domain: "Craft and Structure",
            skill: "Words in Context",
            difficulty: difficulty(q),
            answer_type: "mc_single",
            stem: null,
            passage: null,
            figure_url: null,
            content: { pos: info.pos, definition: info.definition, options: sorted.map((c) => c.text), correctIndex },
            explanation: q.explanation,
            status: "published",
            created_by: SEED_BY,
          });
        }
      });
    }
  }

  // ---- Flashcards: distinct vocab words ----
  if (want("flashcards") && !dryRun) {
    const words = take([...vocabWords.values()]);
    console.log(`\nFlashcard words: ${words.length}`);
    await pool("flashcards", words, CONCURRENCY, async (word) => {
      const info = await flashcardInfo(word);
      if (!info) return;
      rows.push({
        id: `fc-${slugify(word)}`,
        drill_slug: "flashcards",
        section: null,
        domain: null,
        skill: null,
        difficulty: "medium",
        answer_type: "spaced_repetition",
        stem: null,
        passage: null,
        figure_url: null,
        content: { word, pos: info.pos, definition: info.definition, example: info.example },
        explanation: null,
        status: "published",
        created_by: SEED_BY,
      });
    });
  }

  // ---- Reading: substantive RW comprehension passages (deduped) ----
  if (want("reading")) {
    const seen = new Set<string>();
    const cand: Q[] = [];
    for (const q of qs) {
      if (section(q) !== "rw" || !q.passage) continue;
      const dom = canonicalDomain(q.domain);
      const skill = canonicalSkill(q.skill);
      const comprehension = dom === "Information and Ideas" || (dom === "Craft and Structure" && skill !== "Words in Context");
      if (!comprehension) continue;
      const body = q.passage.trim();
      if (body.length < 300) continue; // skip short fill-in stimuli
      if (seen.has(body)) continue;
      seen.add(body);
      cand.push(q);
    }
    const limited = take(cand);
    console.log(`\nReading candidates (distinct substantive passages): ${limited.length}`);
    if (!dryRun) {
      await pool("reading", limited, CONCURRENCY, async (q) => {
        const body = q.passage!.trim();
        const keyPoints = await readingKeyPoints(body);
        if (keyPoints.length === 0) return;
        const words = body.split(/\s+/).length;
        const readSeconds = Math.max(40, Math.min(200, Math.round(words * 0.6)));
        rows.push({
          id: `rd-${q.id}`,
          drill_slug: "reading",
          section: "rw",
          domain: canonicalDomain(q.domain) ?? q.domain,
          skill: canonicalSkill(q.skill),
          difficulty: difficulty(q),
          answer_type: "free_text",
          stem: null,
          passage: null,
          figure_url: q.figure_url,
          content: { body: [body], readSeconds, keyPoints, level: 1 },
          explanation: null,
          status: "published",
          created_by: SEED_BY,
        });
      });
    }
  }

  if (dryRun) {
    console.log(`\n[dry-run] mapping only — no AI calls, no writes.`);
    return;
  }

  // ---- Write ----
  console.log(`\nUpserting ${rows.length} drill questions…`);
  const ids = rows.map((r) => r.id);
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supabase.from("drill_questions").upsert(rows.slice(i, i + 200), { onConflict: "id" });
    if (error) throw error;
  }

  // Refresh walkthrough steps for the seeded questions (delete-then-insert).
  console.log(`Refreshing ${steps.length} walkthrough steps…`);
  for (let i = 0; i < ids.length; i += 100) {
    const { error } = await supabase.from("drill_walkthrough_steps").delete().in("question_id", ids.slice(i, i + 100));
    if (error) throw error;
  }
  for (let i = 0; i < steps.length; i += 200) {
    const { error } = await supabase.from("drill_walkthrough_steps").insert(steps.slice(i, i + 200));
    if (error) throw error;
  }

  const byDrill = rows.reduce<Record<string, number>>((acc, r) => ((acc[r.drill_slug] = (acc[r.drill_slug] ?? 0) + 1), acc), {});
  console.log(`\n✓ Seeded drill questions:`);
  for (const [d, n] of Object.entries(byDrill)) console.log(`    ${String(n).padStart(4)}  ${d}`);
  console.log(`    ${String(steps.length).padStart(4)}  walkthrough steps`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
