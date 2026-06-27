// Sanity checks for the SAT scoring approximation (lib/sat/scoring.ts).
// No test runner is configured, so this mirrors the repo's tsx-script convention:
//   npx tsx scripts/sat/score-check.ts
// Exits non-zero if any assertion fails. Asserts the WS1 acceptance criteria:
// section scores clamp to 200-800, total clamps to 400-1600, the easy path is
// capped below 800, scoring is monotonic, and harder items count for more.

import type {
  AnswerMap,
  Difficulty,
  Domain,
  ModuleVariant,
  MultipleChoiceQuestion,
  PracticeTest,
  Section,
  SectionId,
  TestModule,
} from "../../lib/sat/types";
import { LOWER_PATH_CAP, scoreSection, scoreTest } from "../../lib/sat/scoring";

let failures = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) {
    console.log(`ok   ${msg}`);
  } else {
    failures += 1;
    console.error(`FAIL ${msg}`);
  }
}

function q(id: string, difficulty: Difficulty, domain: Domain): MultipleChoiceQuestion {
  return {
    id,
    type: "mc",
    domain,
    difficulty,
    prompt: id,
    explanation: "",
    choices: [
      { id: "A", text: "a" },
      { id: "B", text: "b" },
    ],
    correct: "A",
  };
}

function mod(
  id: string,
  order: 1 | 2,
  variant: ModuleVariant | undefined,
  n: number,
  difficulty: Difficulty,
  domain: Domain,
): TestModule {
  const questions = Array.from({ length: n }, (_, i) => q(`${id}-${i}`, difficulty, domain));
  return { id, order, variant, questions };
}

function section(id: SectionId, domain: Domain, perModule: number): Section {
  return {
    id,
    name: id,
    shortName: id,
    minutesPerModule: id === "math" ? 35 : 32,
    module1: mod(`${id}-m1`, 1, undefined, perModule, "medium", domain),
    module2: {
      easy: mod(`${id}-m2e`, 2, "easy", perModule, "medium", domain),
      hard: mod(`${id}-m2h`, 2, "hard", perModule, "medium", domain),
    },
  };
}

function answersFor(questions: { id: string }[], correct: boolean): AnswerMap {
  const m: AnswerMap = {};
  for (const x of questions) m[x.id] = correct ? "A" : "B";
  return m;
}

const rw = section("rw", "Information and Ideas", 27);
const math = section("math", "Algebra", 22);

// 1) Per-section, per-path floors and ceilings.
for (const sec of [rw, math]) {
  for (const variant of ["easy", "hard"] as ModuleVariant[]) {
    const qs = [...sec.module1.questions, ...sec.module2[variant].questions];
    const none = scoreSection(sec, variant, answersFor(qs, false));
    const all = scoreSection(sec, variant, answersFor(qs, true));
    const top = variant === "easy" ? LOWER_PATH_CAP[sec.id] : 800;
    assert(none.scaled === 200, `${sec.id}/${variant}: all wrong -> 200 (got ${none.scaled})`);
    assert(all.scaled === top, `${sec.id}/${variant}: all correct -> ${top} (got ${all.scaled})`);
    assert(all.scaled >= 200 && all.scaled <= 800, `${sec.id}/${variant}: clamps to 200-800`);
    if (variant === "easy") {
      assert(all.scaled < 800, `${sec.id}/easy: capped below 800 (got ${all.scaled})`);
    }
  }
}

// 1b) Hard path reserves 800 for a perfect section: one wrong stays below 800.
{
  const variant: ModuleVariant = "hard";
  const qs = [...rw.module1.questions, ...rw.module2[variant].questions];
  const oneWrong = answersFor(qs, true);
  oneWrong[qs[0].id] = "B"; // miss exactly one
  assert(scoreSection(rw, variant, oneWrong).scaled < 800, "rw/hard: one wrong stays below 800");
}

// 2) Monotonic: flipping answers from wrong to correct never lowers the score.
{
  const variant: ModuleVariant = "hard";
  const qs = [...rw.module1.questions, ...rw.module2[variant].questions];
  const m = answersFor(qs, false);
  let prev = -1;
  let monotonic = true;
  for (const x of qs) {
    m[x.id] = "A";
    const scaled = scoreSection(rw, variant, m).scaled;
    if (scaled < prev) monotonic = false;
    prev = scaled;
  }
  assert(monotonic, "rw/hard: scaled never decreases as more answers become correct");
}

// 3) Difficulty-aware: one hard question right outscores one easy question right.
{
  const m1: TestModule = {
    id: "d-m1",
    order: 1,
    variant: undefined,
    questions: [q("d-easy", "easy", "Algebra"), q("d-hard", "hard", "Algebra")],
  };
  const m2 = (id: string, v: ModuleVariant): TestModule => ({
    id,
    order: 2,
    variant: v,
    questions: [q(`${id}-a`, "medium", "Algebra"), q(`${id}-b`, "medium", "Algebra")],
  });
  const ds: Section = {
    id: "math",
    name: "Math",
    shortName: "Math",
    minutesPerModule: 35,
    module1: m1,
    module2: { easy: m2("d-m2e", "easy"), hard: m2("d-m2h", "hard") },
  };
  const easyOnly = scoreSection(ds, "hard", { "d-easy": "A" }).scaled;
  const hardOnly = scoreSection(ds, "hard", { "d-hard": "A" }).scaled;
  assert(hardOnly >= easyOnly, `difficulty weighting: hard-correct (${hardOnly}) >= easy-correct (${easyOnly})`);
}

// 4) Full-test composite: clamps to 400-1600 and sums the two section scores.
{
  const test: PracticeTest = {
    id: "t",
    title: "Sanity",
    sections: [rw, math],
    routeThreshold: { rw: 0.67, math: 0.64 },
    breakMinutes: 10,
  };
  const routed: Partial<Record<SectionId, ModuleVariant>> = { rw: "hard", math: "easy" };
  const everything: AnswerMap = {};
  for (const sec of [rw, math]) {
    for (const x of [
      ...sec.module1.questions,
      ...sec.module2.easy.questions,
      ...sec.module2.hard.questions,
    ]) {
      everything[x.id] = "A";
    }
  }
  const res = scoreTest(test, routed, everything);
  assert(res.total >= 400 && res.total <= 1600, `composite clamps to 400-1600 (got ${res.total})`);
  for (const s of res.sections) {
    assert(s.scaled >= 200 && s.scaled <= 800, `${s.sectionId}: section clamps to 200-800 (got ${s.scaled})`);
  }
  // rw hard all-correct (800) + math easy all-correct (650) = 1450.
  assert(res.total === 1450, `mixed-path composite = 1450 (got ${res.total})`);
}

if (failures > 0) {
  console.error(`\n${failures} assertion(s) FAILED`);
  process.exit(1);
}
console.log("\nAll scoring sanity checks passed.");
