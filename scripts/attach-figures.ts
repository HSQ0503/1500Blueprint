/**
 * Attach figures the importer missed, by copying a figure_url from a sibling
 * question that already has the same image (e.g. the 2A/2B variants of a
 * question share one table). Idempotent — safe to re-run.
 *
 *   npx tsx scripts/attach-figures.ts            (apply)
 *   npx tsx scripts/attach-figures.ts --dry-run  (preview only)
 *
 * Add rows to COPIES as more missing figures are found. variant: 'm1' | 'easy' (2A) | 'hard' (2B).
 */
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } },
);

type Ref = { section: "rw" | "math"; order: 1 | 2; variant: "m1" | "easy" | "hard"; position: number };

// Each row: copy the figure_url FROM a question that has it TO one that's missing it.
const COPIES: { slug: string; from: Ref; to: Ref; note: string }[] = [
  {
    slug: "practice-test-1",
    from: { section: "rw", order: 2, variant: "hard", position: 11 }, // RW 2B Q11 (has the flowering table)
    to: { section: "rw", order: 2, variant: "easy", position: 11 }, //   RW 2A Q11 (same table, missing)
    note: "broadleaf arrowhead flowering-period table",
  },
];

const dryRun = process.argv.includes("--dry-run");

async function findQuestion(slug: string, ref: Ref) {
  const { data: t } = await supabase.from("tests").select("id").eq("slug", slug).maybeSingle();
  if (!t) throw new Error(`test not found: ${slug}`);
  // `order` is a reserved PostgREST query param, so fetch modules and match in JS.
  const { data: mods } = await supabase
    .from("modules").select("id,section,order,variant").eq("test_id", t.id);
  const m = (mods ?? []).find(
    (x) => x.section === ref.section && x.order === ref.order && x.variant === ref.variant,
  );
  if (!m) throw new Error(`module not found: ${slug} ${ref.section} ${ref.order} ${ref.variant}`);
  const { data: q } = await supabase
    .from("questions").select("id,figure_url,prompt")
    .eq("module_id", m.id).eq("position", ref.position).maybeSingle();
  if (!q) throw new Error(`question not found: ${slug} ${ref.section} ${ref.order}/${ref.variant} Q${ref.position}`);
  return q;
}

async function main() {
  for (const c of COPIES) {
    const src = await findQuestion(c.slug, c.from);
    const dst = await findQuestion(c.slug, c.to);
    const fromTag = `${c.from.section} ${c.from.order}/${c.from.variant} Q${c.from.position}`;
    const toTag = `${c.to.section} ${c.to.order}/${c.to.variant} Q${c.to.position}`;
    console.log(`\n${c.slug}: ${fromTag} → ${toTag}  (${c.note})`);
    console.log(`  source figure_url: ${src.figure_url ?? "(NONE!)"}`);
    console.log(`  target currently:  ${dst.figure_url ?? "(none)"}`);
    if (!src.figure_url) { console.log("  ✗ SKIP — source has no figure to copy"); continue; }
    if (dst.figure_url === src.figure_url) { console.log("  = already attached, nothing to do"); continue; }
    if (dryRun) { console.log("  [dry-run] would set target figure_url"); continue; }
    const { error } = await supabase.from("questions").update({ figure_url: src.figure_url }).eq("id", dst.id);
    if (error) throw error;
    console.log("  ✓ attached");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
