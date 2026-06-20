// Static fixtures that drive the drill UIs while we build the look. The logic
// phase swaps these for real content + AI calls; the component props do not change.

import type { GrammarQuestion, MasteryState, ProcessFeedback } from "./types";

export const grammarQuestion: GrammarQuestion = {
  id: "g-machu-picchu",
  type: "mc",
  pattern: "Boundaries: joining two independent clauses",
  domain: "Standard English Conventions",
  difficulty: "medium",
  passage:
    "Humans were long thought to have begun occupying the Peruvian settlement of Machu Picchu between 1440 and 1450 CE. However, a team led by anthropologist Dr. Richard Burger used accelerator mass spectrometry to uncover evidence that it was occupied ______ 1420 CE, according to Burger, humans were likely inhabiting the area.",
  prompt:
    "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    { id: "A", text: "earlier. In" },
    { id: "B", text: "earlier, in" },
    { id: "C", text: "earlier, which in" },
    { id: "D", text: "earlier in" },
  ],
  correct: "A",
  explanation:
    "A period is needed to separate two independent clauses. The clause before the blank ('a team ... used ... evidence that it was occupied earlier') is independent, and the clause after it ('In 1420 CE, according to Burger, humans were likely inhabiting the area') is independent. Only choice A places a period between them.",
};

export const grammarMastery: MasteryState = {
  mastered: 0,
  total: 25,
  streak: 0,
  streakTarget: 2,
  cycle: 1,
};

// A sub-100 attempt: resets the streak and lists the critical-path steps missed.
export const grammarFailFeedback: ProcessFeedback = {
  score: 0,
  verdict: "Several important details were missing.",
  feedback:
    "Your explanation did not work through the critical path for this question. The path required looking at the answer choices first and noticing the period in choice A as the first thing to check per the priority list, then checking for an independent clause before the blank by identifying the subject 'a team' and the main verb 'used', then checking for an independent clause after the blank by identifying the subject 'humans' and the main verb 'were', then confirming both independent clauses exist and selecting choice A. Walk through each of those steps next time.",
  stepsMissed: [
    "Look at the answer choices first and identify the period in choice A as the first thing to check per the priority list",
    "Check for an independent clause BEFORE the blank by identifying the subject 'a team' and the main verb 'used'",
    "Check for an independent clause AFTER the blank by identifying the subject 'humans' and the main verb 'were'",
    "Confirm both independent clauses exist and select choice A",
  ],
};

// A perfect attempt: advances the mastery streak.
export const grammarPassFeedback: ProcessFeedback = {
  score: 100,
  verdict: "Excellent. You worked the full critical path.",
  feedback:
    "You started from the answer choices and spotted that choice A uses a period. You identified the independent clause before the blank ('a team ... used ... evidence') and the independent clause after it ('humans were likely inhabiting the area'), recognized that two independent clauses must be separated by a period, and selected A. That is exactly the priority-list approach.",
  stepsMissed: [],
};
