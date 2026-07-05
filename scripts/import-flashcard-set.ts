/** Bulk-load cards into EXISTING flashcard sets from a plain-text file.
 *  Built to repopulate the two sets whose cards were lost to the missing-column
 *  bug, but reusable for authoring any set in bulk.
 *
 *  Usage:
 *    npx tsx scripts/import-flashcard-set.ts <file>            # dry run (writes nothing)
 *    npx tsx scripts/import-flashcard-set.ts <file> --commit   # actually write
 *
 *  File format (one block per set):
 *    # Exact Set Title
 *    term <TAB> definition
 *    term | definition
 *    ...
 *    # Another Exact Set Title
 *    ...
 *
 *  A line starting with "#" names the set (must already exist). Each following
 *  non-empty line is one card, split on the first TAB, else " | ", else 2+ spaces.
 *  Matching is by exact title among sets owned by OWNER (default: Scott). On
 *  --commit, each matched set's cards are REPLACED (delete + insert), so re-running
 *  with corrected content is safe.
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

const OWNER = process.env.OWNER ?? "scott@scottssatprep.com";
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SECRET_KEY ?? "",
  { auth: { persistSession: false, autoRefreshToken: false } },
);

type Card = { term: string; definition: string };
type Block = { title: string; cards: Card[] };

function splitCard(line: string): Card | null {
  let parts: string[];
  if (line.includes("\t")) parts = line.split("\t");
  else if (line.includes(" | ")) parts = line.split(" | ");
  else {
    const m = line.match(/^(.*?)\s{2,}(.*)$/);
    parts = m ? [m[1], m[2]] : [line];
  }
  const term = (parts[0] ?? "").trim();
  const definition = parts.slice(1).join(" ").trim();
  if (!term && !definition) return null;
  return { term, definition };
}

function parse(text: string): Block[] {
  const blocks: Block[] = [];
  let current: Block | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) continue;
    if (line.startsWith("#")) {
      current = { title: line.replace(/^#\s*/, "").trim(), cards: [] };
      blocks.push(current);
      continue;
    }
    if (!current) {
      console.warn(`  ! ignoring line before any "# Set Title": ${line}`);
      continue;
    }
    const card = splitCard(line);
    if (card) current.cards.push(card);
  }
  return blocks;
}

async function main() {
  const file = process.argv[2];
  const commit = process.argv.includes("--commit");
  if (!file) {
    console.error("Usage: npx tsx scripts/import-flashcard-set.ts <file> [--commit]");
    process.exit(1);
  }
  const blocks = parse(fs.readFileSync(path.resolve(file), "utf8"));
  console.log(`Parsed ${blocks.length} set block(s). Owner: ${OWNER}. Mode: ${commit ? "COMMIT" : "DRY RUN"}\n`);

  for (const block of blocks) {
    const { data: matches } = await db
      .from("flashcard_sets")
      .select("id, title")
      .eq("owner_email", OWNER)
      .eq("title", block.title);
    const rows = (matches ?? []) as { id: string; title: string }[];

    console.log(`# ${block.title}  (${block.cards.length} cards)`);
    if (rows.length === 0) { console.log(`  ✗ no set with that exact title owned by ${OWNER} — skipped\n`); continue; }
    if (rows.length > 1) { console.log(`  ✗ ${rows.length} sets share that title — skipped (ambiguous)\n`); continue; }
    const setId = rows[0].id;
    block.cards.slice(0, 3).forEach((c, i) => console.log(`  ${i + 1}. ${c.term}  →  ${c.definition}`));
    if (block.cards.length > 3) console.log(`  … and ${block.cards.length - 3} more`);

    if (!commit) { console.log(`  (dry run — would replace cards on set ${setId})\n`); continue; }

    await db.from("flashcard_cards").delete().eq("set_id", setId);
    const insert = block.cards.map((c, i) => ({
      set_id: setId, position: i + 1, term: c.term, definition: c.definition,
      term_image_url: null, definition_image_url: null,
    }));
    const { error } = await db.from("flashcard_cards").insert(insert);
    console.log(error ? `  ✗ insert failed: ${error.message}\n` : `  ✓ wrote ${insert.length} cards to set ${setId}\n`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
