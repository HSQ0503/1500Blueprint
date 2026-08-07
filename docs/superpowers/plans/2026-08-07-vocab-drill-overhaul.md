# Vocab Drill Overhaul Implementation Plan

> **For Codex:** Execute this plan test-first and verify each requirement before publishing.

**Goal:** Bring the Vocab Drill in line with Scott's 08/07 specification: scalable word imports, seven-question sessions, persistent three-in-a-row mastery and streaks, automatic/manual flashcard capture, and useful progress/session reporting.

**Architecture:** Keep deterministic rules in pure TypeScript modules covered by Node tests. Put all student mutations behind authenticated Route Handlers and service-role Supabase helpers. Pass initial server data into focused client components, then reconcile each answer/settings/bookmark mutation with the server response.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase/Postgres, Tailwind CSS v4, Node test runner via `tsx --test`.

---

### Task 1: Lock the business rules with failing tests

- [x] Add tests for seven-question session selection.
- [x] Add tests for per-word three-correct mastery and wrong-answer reset.
- [x] Add tests for global current/best streak changes.
- [x] Add tests for rolling accuracy and time summaries.
- [x] Add import parser tests for CSV, TSV, TXT, JSON, duplicates, bad rows, and 1,000+ words.
- [x] Run the focused tests and confirm they fail for the missing implementation.

### Task 2: Add deterministic vocab and import modules

- [x] Implement the mastery/streak/session/statistics helpers.
- [x] Implement the large-file parser and four-option question builder.
- [x] Run focused tests until green.

### Task 3: Add durable storage and authenticated APIs

- [x] Reuse the deployed progress, private flashcard-set, and module-attempt tables for durable state with no schema rollout dependency.
- [x] Implement server helpers for dashboard state, answer recording, session completion, settings, and flashcard CRUD.
- [x] Add authenticated Route Handlers for answer, session, settings, flashcards, and admin bulk import.
- [x] Keep correctness and authorization decisions server-side.

### Task 4: Rebuild the Vocab Drill experience

- [x] Limit every session to seven questions.
- [x] Show and persist auto-add, mastered count, and current streak in the top panel.
- [x] Persist manual option bookmarks to the student's Vocab Flashcards deck.
- [x] Auto-add missed words only when the toggle is enabled.
- [x] Add the detailed seven-answer completion summary and rotating Practice Again sessions.
- [x] Add the progress view with mastery guidance and rolling session metrics.

### Task 5: Connect hub, flashcards, and admin import

- [x] Replace static hub vocab/flashcard numbers with student data.
- [x] Load the student's saved vocab deck in Vocab Flashcards, including an intentional empty state.
- [x] Add an admin upload panel accepting CSV, TSV, TXT, and JSON with an import report.

### Task 6: Verify and publish

- [x] Run focused tests, the full test suite, lint, type/build validation, and a clean diff review.
- [x] Exercise the key UI path in a browser when the local app/auth state permits it.
- [x] Commit the scoped changes and push the verified result to `main`.
