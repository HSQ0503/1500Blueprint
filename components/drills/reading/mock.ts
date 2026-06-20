// Local mock data for the Reading Comprehension Drill (UI-first, no backend).
// A passage plus the key points the AI recall grader checks the summary
// against, and two canned grading results (a strong recall and a weak one) so
// both feedback states can be polished. The logic phase swaps these for a
// generated passage + live "grade-summary" AI call returning the same shapes.

export type ReadingPassage = {
  level: number;
  readSeconds: number; // countdown length for the timed read
  body: string[]; // paragraphs of the passage
};

// One checkable idea from the passage. `captured` is what the mock grader
// decided the student recalled; the real grader fills the same field.
export type KeyPoint = {
  text: string;
  captured: boolean;
};

export type RecallFeedback = {
  score: number; // 0..100
  verdict: string; // one-line report-card summary
  keyPoints: KeyPoint[];
};

export const readingPassage: ReadingPassage = {
  level: 1,
  readSeconds: 118,
  body: [
    "Handmade tiles are making a strong comeback on the outside walls of new buildings. Architects and builders are choosing these tiles because each one is slightly different, giving buildings a unique, human quality that machine-made materials cannot match. The tiles are shaped and painted by hand, so small variations in color and texture appear across a wall's surface. This creates a rich, layered look that changes depending on the light and the time of day. Cities like Lisbon, Mexico City, and Los Angeles have seen new restaurants, hotels, and apartment buildings decorated this way. One popular approach uses deep blue and green glazes applied over rough clay, producing walls that feel both old and completely fresh.",
  ],
};

// The canonical key points the recall is scored against (order = passage order).
const KEY_POINTS = [
  "Handmade tiles are returning to the exterior walls of new buildings.",
  "Each tile is slightly different, giving a unique, human quality machine-made materials lack.",
  "Hand shaping and painting produce small variations in color and texture across the wall.",
  "The result is a rich, layered look that shifts with the light and time of day.",
  "Cities like Lisbon, Mexico City, and Los Angeles use the tiles on restaurants, hotels, and apartments.",
  "A popular approach layers deep blue and green glazes over rough clay for a look both old and fresh.",
] as const;

// Strong recall: most points captured, one missed.
export const recallPass: RecallFeedback = {
  score: 88,
  verdict: "Strong recall. You held onto the main idea and most supporting detail.",
  keyPoints: KEY_POINTS.map((text, i) => ({ text, captured: i !== 4 })),
};

// Weak recall: gist only, specifics dropped.
export const recallFail: RecallFeedback = {
  score: 42,
  verdict: "You caught the gist but lost most of the supporting detail.",
  keyPoints: KEY_POINTS.map((text, i) => ({ text, captured: i < 2 })),
};

// Progression chrome (matches the reference rule text).
export const readingProgress = {
  level: 1,
  streak: 0,
  streakTarget: 3,
};
