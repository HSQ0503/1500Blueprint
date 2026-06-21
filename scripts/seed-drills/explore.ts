/**
 * Read-only: summarize the practice-test question bank so we can plan the drill
 * prefill. Counts by section / domain / skill / type, plus figure + grid-in
 * counts. Run: npx tsx scripts/seed-drills/explore.ts
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
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SECRET_KEY ?? "",
  { auth: { persistSession: false } },
);

type Row = {
  type: string;
  domain: string | null;
  skill: string | null;
  difficulty: string | null;
  passage: string | null;
  figure_url: string | null;
  modules: { section: string } | { section: string }[] | null;
};

function section(r: Row): string {
  const m = r.modules;
  if (!m) return "?";
  return Array.isArray(m) ? (m[0]?.section ?? "?") : m.section;
}

function bump(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function dump(title: string, map: Map<string, number>) {
  console.log(`\n${title}`);
  for (const [k, v] of [...map.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(v).padStart(4)}  ${k}`);
  }
}

async function main() {
  const all: Row[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("questions")
      .select("type,domain,skill,difficulty,passage,figure_url,modules(section)")
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as unknown as Row[]));
    if (data.length < pageSize) break;
  }

  console.log(`Total questions: ${all.length}`);

  const bySection = new Map<string, number>();
  const byType = new Map<string, number>();
  const byDifficulty = new Map<string, number>();
  const byDomain = new Map<string, number>();
  const bySkill = new Map<string, number>();
  let withFigure = 0;
  let withPassage = 0;

  // Candidate tallies for the prefill.
  let grammar = 0; // RW Standard English Conventions, mc
  let mathGrid = 0; // Math grid-in
  let mathMc = 0; // Math mc
  let wordsInContext = 0; // RW Words in Context, mc (vocab source)
  const readingPassages = new Set<string>(); // distinct RW non-SEC passages

  for (const r of all) {
    const sec = section(r);
    bump(bySection, sec);
    bump(byType, r.type);
    bump(byDifficulty, r.difficulty ?? "(none)");
    bump(byDomain, `${sec} · ${r.domain ?? "(none)"}`);
    bump(bySkill, `${sec} · ${r.skill ?? "(none)"}`);
    if (r.figure_url) withFigure++;
    if (r.passage) withPassage++;

    const dom = (r.domain ?? "").toLowerCase();
    const skill = (r.skill ?? "").toLowerCase();
    if (sec === "rw" && dom.includes("standard english") && r.type === "mc") grammar++;
    if (sec === "math" && r.type === "grid") mathGrid++;
    if (sec === "math" && r.type === "mc") mathMc++;
    if (sec === "rw" && skill.includes("words in context") && r.type === "mc") wordsInContext++;
    if (sec === "rw" && !dom.includes("standard english") && r.passage) readingPassages.add(r.passage.trim());
  }

  dump("By section", bySection);
  dump("By type", byType);
  dump("By difficulty", byDifficulty);
  dump("By domain", byDomain);
  dump("By skill", bySkill);

  console.log(`\nFigures: ${withFigure} questions have figure_url`);
  console.log(`Passages: ${withPassage} questions have a passage`);
  console.log(`\n--- Prefill candidates ---`);
  console.log(`  Grammar (RW Standard English Conventions, mc): ${grammar}`);
  console.log(`  Targeted-math (Math grid-in): ${mathGrid}`);
  console.log(`  (Math mc, would map to ai-math — left blank): ${mathMc}`);
  console.log(`  Vocab source (RW Words in Context, mc): ${wordsInContext}`);
  console.log(`  Reading distinct passages (RW non-SEC, has passage): ${readingPassages.size}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
