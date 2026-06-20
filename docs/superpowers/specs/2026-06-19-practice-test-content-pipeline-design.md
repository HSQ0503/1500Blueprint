# Practice-Test Content Pipeline — Design Spec

**Date:** 2026-06-19
**Status:** Draft for review
**Sub-project:** #1 of the "real practice tests" effort (content + DB + display)

## Goal

Port Scott's real practice-test content (Google Docs → `.docx`) into a Supabase
database and have the existing Bluebook runner render a real test — with figures
and AI-drafted per-choice feedback — end-to-end through the results screen.

This is the first of several specs. Explicitly **deferred to later specs:**
student auth/login, persisting attempts/results across sessions, official
raw→scaled score tables, a multi-test selection UI, and the AI drilling agent.

## Locked decisions

- **DB / hosting:** Supabase Postgres + Prisma; Vercel; everything lands in
  Scott-owned infra.
- **Tests housed in the DB** (normalized tables), not static files or JSON blobs.
- **Images:** Supabase Storage (public bucket), URL stored on the question.
- **Feedback:** per-choice explanations **AI-generated at import**, tagged
  `explanationSource: 'ai'` for human review (Scott's docs have none).
- **Input format:** **one `.docx` per full test**, exported from Google Docs.
- **Module-2 variants:** `2A` = **easy**, `2B` = **hard**.

## Content format (validated against "Practice Test 4")

One `.docx` contains all 6 modules, delimited by header lines:
`RW Mod 1`, `RW 2A`, `RW 2B`, `Math Mod 1`, `Math 2A`, `Math 2B`.

Per question:
```
Question N
 (section – [domain –] skill – difficulty)
<stimulus / passage — may be multiple paragraphs; may include an image>
<prompt>
 A. … B. … C. … D. …        ← or a grid-in (no choices)
Correct answer: X            ← or "Answer: X"; grid-in: "200", "8 or −8"
```

**Real-content quirks the importer must normalize (found in the sample):**
- Answer label varies: `Correct answer:` (R&W) vs `Answer:` (Math).
- Breadcrumb arity varies (4-part with domain, 3-part without, occasionally
  absent); inconsistent dashes / spacing / casing.
- `Question N` and its breadcrumb may be on separate lines, with an image between.
- Images appear immediately **before** a question header or **inside** the block;
  one image may be **reused** by multiple questions.
- Grid-ins: single or multiple accepted answers (`8 or −8`), negatives (U+2212).

## A. Data model (Prisma / Supabase Postgres)

Normalized so questions are first-class rows (needed later for domain-mastery
analytics, the AI drilling agent, and admin editing).

```prisma
model Test {
  id            String   @id @default(cuid())
  slug          String   @unique          // "practice-test-4"
  title         String
  breakMinutes  Int      @default(10)
  rwThreshold   Float    @default(0.70)   // route to hard M2 if frac correct >=
  mathThreshold Float    @default(0.60)
  sourceFile    String?
  modules       Module[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Module {
  id               String         @id @default(cuid())
  testId           String
  test             Test           @relation(fields: [testId], references: [id], onDelete: Cascade)
  section          String         // "rw" | "math"
  order            Int            // 1 | 2
  variant          String?        // null (order 1) | "easy" (2A) | "hard" (2B)
  minutesPerModule Int            // 32 rw / 35 math
  label            String?        // raw header, e.g. "RW 2A"
  questions        Question[]
  @@unique([testId, section, order, variant])
}

model Question {
  id                String   @id @default(cuid())
  moduleId          String
  module            Module   @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  position          Int      // 1-based within module
  type              String   // "mc" | "grid"
  domain            String?  // one of the 8 SAT domains; null -> needsReview
  skill             String?
  difficulty        String?  // "easy" | "medium" | "hard"
  passage           String?
  prompt            String
  figureUrl         String?
  correct           String?  // "A".."D" for mc
  acceptedAnswers   String[] // grid-in
  explanation       String?
  explanationSource String?  // "ai" | "human"
  needsReview       Boolean  @default(false)
  choices           Choice[]
  @@unique([moduleId, position])
}

model Choice {
  id          String  @id @default(cuid())
  questionId  String
  question    Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  letter      String   // "A".."D"
  text        String
  explanation String?  // per-choice "why right / why wrong"
  @@unique([questionId, letter])
}
```

A server loader (`lib/sat/loadTest.ts`) assembles these rows into the existing
`PracticeTest` shape from `lib/sat/types.ts`, so the runner and scoring logic
change minimally. `types.ts` gains an optional `figureUrl` on the question.

## B. Importer (`scripts/import-test.ts`, re-runnable)

1. Unzip `.docx`; flatten `word/document.xml` to ordered blocks (text + image
   refs via `word/_rels`), reusing the analysis approach already validated.
2. Segment into modules by tolerant header regex; map `Mod 1`→order 1/null,
   `2A`→order 2/easy, `2B`→order 2/hard, per section.
3. Segment each module into questions by `Question N` lines (numbering restarts).
4. Per block: parse breadcrumb (tolerant split; map **skill → domain** via the
   fixed SAT taxonomy when domain is omitted), stimulus, prompt, choices (MC) or
   grid-in answers, and answer (`Correct answer:` / `Answer:`). Attach the
   adjacent image. Anything untaggable/ambiguous → `needsReview = true`.
5. Upload each unique image to Supabase Storage (`figures/<slug>/imageN.ext`),
   dedupe by media filename, store the public URL.
6. For each question, call Claude to draft `explanation` + per-choice
   `choice.explanation`; tag `explanationSource = 'ai'`.
7. Upsert into the DB, idempotent by `(test slug, section, order, variant,
   position)`. Re-runs replace, never duplicate.
8. Print an **import report**: per-module counts, flagged `needsReview`
   questions, images uploaded, explanations generated, parse warnings.

## C. Runner wiring

- `/practice-test` becomes a server component that loads a test by slug from the
  DB via `loadTest.ts` and passes the assembled `PracticeTest` to `TestRunner`.
- Render `figureUrl` (figure above the prompt for Math, within the stimulus for
  R&W) using `next/image`.
- `sampleTest.ts` stays as a dev fallback. Routing/timing/scoring unchanged.

## AI explanation generation

- Default to a strong Claude model (e.g. `claude-sonnet-4-6`, configurable),
  one call per question, returning structured JSON (overall + per-choice).
- Prompt includes stimulus, prompt, all choices, and the correct answer; asks why
  the correct answer is right and why each distractor is wrong.
- All output tagged `ai` and `needsReview`-eligible so Scott can audit/edit later.

## Acceptance criteria

- `npm run import:test -- content/raw/<file>.docx` populates Supabase with the
  test (6 modules, all questions/choices/images/AI explanations) and prints a
  report flagging any untaggable questions.
- `/practice-test` loads that test from the DB and runs end-to-end (intro →
  modules → routing → break → results), including figures, matching today's UX.
- Re-running the importer produces no duplicates.

## Risks & mitigations

- **Parser brittleness across tests** → import report + `needsReview` flags;
  validate on 2–3 real tests before bulk import.
- **AI explanation quality/cost** → tagged for review; model configurable;
  re-generatable per question.
- **Image-to-question attachment ambiguity** → report lists each image's mapped
  question for a quick spot-check.

## Open questions (non-blocking for this spec)

- Total number of tests, and whether "full-length drills" are subsets.
- Whether any questions are unscored pretest items (default: score all).
- Official raw→scaled tables (future spec; current approximation stays).
