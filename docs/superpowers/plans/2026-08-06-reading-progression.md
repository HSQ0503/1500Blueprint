# Reading Drill Progression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist an 85-point reading streak, advance one level after three consecutive passes, and render passing reading scores with a green result banner.

**Architecture:** Rebuild reading progression from chronological `drill_attempts` using a pure calculator, load it in the reading Server Component, and return the refreshed state from the grading route. Keep the shared score banner backward compatible by adding a configurable success threshold that defaults to 100.

**Tech Stack:** TypeScript, React 19, Next.js 16 App Router, Supabase, Node test runner through `tsx`.

---

## File structure

- Create `lib/drills/readingProgress.ts`: pure threshold, streak, and level calculation.
- Create `lib/drills/readingProgress.test.ts`: boundary and consecutive-pass tests.
- Create `lib/drills/scoreTone.ts`: pure score-tone selection with a configurable success threshold.
- Create `lib/drills/scoreTone.test.ts`: default and reading-specific threshold tests.
- Modify `lib/drills/progress.ts`: rebuild persisted reading progression from `drill_attempts`.
- Modify `app/drills/[slug]/page.tsx`: load initial reading progression server-side.
- Modify `app/api/drills/grade/route.ts`: return refreshed progression after a saved reading attempt.
- Modify `components/drills/reading/ReadingDrill.tsx`: render live progression and request the 85-point success tone.
- Modify `components/drills/shared/ScoreBanner.tsx`: accept and use `successThreshold`.
- Modify `package.json`: include the new tests in the explicit test command.

### Task 1: Pure reading progression

**Files:**
- Create: `lib/drills/readingProgress.test.ts`
- Create: `lib/drills/readingProgress.ts`
- Modify: `package.json`

- [ ] **Step 1: Add the failing progression tests and test-script entries**

Create tests that import `calculateReadingProgress`, `READING_PASS_SCORE`, and `READING_STREAK_TARGET`. Assert that 84 resets a prior streak, 85 increments it, three passes produce level 2 with streak 0, an intervening failure breaks the run, and six passes produce level 3 with streak 0. Add the new test path to `npm test`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx tsx --test lib/drills/readingProgress.test.ts`

Expected: FAIL because `lib/drills/readingProgress.ts` does not exist.

- [ ] **Step 3: Implement the minimal calculator**

Create constants `READING_PASS_SCORE = 85` and `READING_STREAK_TARGET = 3`, a `ReadingProgressState` type with `level`, `streak`, and `streakTarget`, and:

```ts
export function calculateReadingProgress(scores: Array<number | null>): ReadingProgressState {
  let level = 1;
  let streak = 0;
  for (const score of scores) {
    if ((score ?? 0) < READING_PASS_SCORE) {
      streak = 0;
      continue;
    }
    streak += 1;
    if (streak === READING_STREAK_TARGET) {
      level += 1;
      streak = 0;
    }
  }
  return { level, streak, streakTarget: READING_STREAK_TARGET };
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npx tsx --test lib/drills/readingProgress.test.ts`

Expected: all progression tests pass.

### Task 2: Configurable score-banner success tone

**Files:**
- Create: `lib/drills/scoreTone.test.ts`
- Create: `lib/drills/scoreTone.ts`
- Modify: `components/drills/shared/ScoreBanner.tsx`
- Modify: `package.json`

- [ ] **Step 1: Add failing tone tests**

Test that the default threshold keeps score 85 in the warning tone, `scoreToneFor(85, 85)` returns the success tone, and `scoreToneFor(84, 85)` returns the warning tone. Add the test path to `npm test`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx tsx --test lib/drills/scoreTone.test.ts`

Expected: FAIL because `lib/drills/scoreTone.ts` does not exist.

- [ ] **Step 3: Implement score-tone selection and wire the component**

Create `ScoreTone = "success" | "warning" | "danger"` and `scoreToneFor(score, successThreshold = 100)`. Return success at the threshold, warning at 50 or above, and danger below 50. In `ScoreBanner.tsx`, map that result to the existing Tailwind class sets and add an optional `successThreshold?: number` prop.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npx tsx --test lib/drills/scoreTone.test.ts`

Expected: all tone tests pass.

### Task 3: Persist and display reading progression

**Files:**
- Modify: `lib/drills/progress.ts`
- Modify: `app/drills/[slug]/page.tsx`
- Modify: `app/api/drills/grade/route.ts`
- Modify: `components/drills/reading/ReadingDrill.tsx`

- [ ] **Step 1: Add the server-side progression loader**

Import `calculateReadingProgress` and `ReadingProgressState` into `progress.ts`. Add `loadReadingProgress(email)` that selects chronological `score,created_at` rows from `drill_attempts` where `drill_slug = "reading"` and returns the calculator result.

- [ ] **Step 2: Load initial progression on the reading page**

For signed-in students, load `selectForStudent("reading", ...)` and `loadReadingProgress(email)` in parallel. For the defensive no-session path, use `calculateReadingProgress([])`. Pass the state as `initialProgress` to `ReadingDrill`.

- [ ] **Step 3: Return refreshed progression from grading**

After the existing `awardDrill` call has saved a reading attempt, call `loadReadingProgress(session.email)`. Add `readingProgress` to the grade-summary JSON response. If the award failed, omit the field instead of advancing a non-persisted client state.

- [ ] **Step 4: Render and update live progression**

Change `ReadingDrill` to require `initialProgress`, store it with `useState`, replace it when a grade response contains `readingProgress`, and use it for the level pill, streak dots, streak fraction, and next-level copy. Remove the production dependency on mock `readingProgress`. Render `<ScoreBanner ... successThreshold={READING_PASS_SCORE} />`.

- [ ] **Step 5: Run targeted and full tests**

Run: `npm test`

Expected: all existing and new tests pass without warnings.

### Task 4: Final verification

**Files:**
- Verify all modified files.

- [ ] **Step 1: Inspect the diff**

Run: `git diff --check && git diff --stat && git status --short`

Expected: no whitespace errors and only planned files changed.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: exit 0 with no ESLint errors.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: Next.js compilation, TypeScript, page generation, and finalization all succeed.

- [ ] **Step 4: Re-run the complete tests after build**

Run: `npm test`

Expected: all tests pass with zero failures.
