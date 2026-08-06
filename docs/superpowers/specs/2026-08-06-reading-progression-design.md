# Reading Drill Progression Design

**Date:** 2026-08-06

## Goal

Make the reading drill award a progression streak for scores of at least 85, show passing reading scores with a green result banner, and advance the student one reading level after three consecutive passing scores.

## Progression rules

- A reading score of 85 through 100 is a pass.
- A passing score increments the reading streak by one.
- A score below 85 resets the reading streak to zero.
- The third consecutive passing score advances the reading level by one and resets the streak to zero.
- Reading progression starts at level 1 with a zero streak.
- Existing reading attempts participate in the calculation, so progression survives refreshes and deployments without a new mutable counter.

## Architecture

Add a pure reading-progression calculator that accepts reading scores in chronological order and returns the current level, streak, and streak target. The server will rebuild this state from the existing append-only `drill_attempts` ledger, following the established grammar-mastery pattern.

The reading page will load the student's current reading progression and pass it into the client player. After a reading grade is recorded, the grading route will return the updated reading progression with the grading result. The client will replace its displayed progression with that server response, allowing the header and instructional bar to update immediately.

No database migration is required.

## Result-banner behavior

The shared score banner will accept a configurable success threshold. Its existing default will remain unchanged so other drills retain their current color behavior. The reading drill will set the success threshold to 85, making reading scores of 85 or higher green while lower scores continue through the existing warning and failure tones.

## Data flow

1. The reading page loads published passages and the signed-in student's reading progression in parallel.
2. The player renders the persisted level and streak.
3. The student submits a summary and receives an AI score.
4. The grading route records the attempt and XP using the existing server-side flow.
5. The route rebuilds reading progression from the updated attempt ledger and includes it in the response.
6. The player updates its progression display immediately.

If attempt persistence fails, the route will not invent a client-only streak advancement. The feedback score can still render under the route's existing partial-save behavior, but durable progression remains based on saved attempts.

## Testing

Use test-driven development for the pure progression rules:

- 84 resets the streak.
- 85 increments the streak.
- Three consecutive passing scores advance one level and reset the streak.
- A failure between passes breaks the sequence.
- Multiple groups of three advance multiple levels.

Add coverage for the configurable score-banner threshold or its extracted tone-selection helper, confirming that reading treats 85 as green without changing the default behavior for other drills. Run the complete test suite, ESLint, and the Next.js production build before completion.

## Out of scope

- Changing XP awards or question mastery thresholds.
- Unlocking the reading drill for students.
- Redesigning the reading feedback layout.
- Adding a new progression database table.
