// Local mock data for the Vocab Drill (UI-first, no backend/AI). A timed
// definition-to-word matching set: each item shows a part-of-speech-tagged
// definition and four word options, one of which is the exact correct answer.

export type VocabItem = {
  id: string;
  pos: string;
  definition: string;
  options: string[];
  correct: string;
};

export const vocabItems: VocabItem[] = [
  {
    id: "anachronistic",
    pos: "adj.",
    definition: "out of place in time; outdated, misplaced",
    options: ["effervescent", "beneficial", "anachronistic", "bombastic"],
    correct: "anachronistic",
  },
  {
    id: "laconic",
    pos: "adj.",
    definition: "using very few words; concise to the point of seeming terse",
    options: ["laconic", "verbose", "ornate", "gregarious"],
    correct: "laconic",
  },
  {
    id: "ephemeral",
    pos: "adj.",
    definition: "lasting for a very short time; fleeting and transitory",
    options: ["perpetual", "ephemeral", "ponderous", "robust"],
    correct: "ephemeral",
  },
  {
    id: "assuage",
    pos: "v.",
    definition: "to make an unpleasant feeling less intense; to soothe or relieve",
    options: ["provoke", "exacerbate", "assuage", "bewilder"],
    correct: "assuage",
  },
  {
    id: "ubiquitous",
    pos: "adj.",
    definition: "present, appearing, or found everywhere at once",
    options: ["scarce", "ubiquitous", "clandestine", "fragmentary"],
    correct: "ubiquitous",
  },
  {
    id: "candor",
    pos: "n.",
    definition: "the quality of being open, honest, and sincere in expression",
    options: ["candor", "duplicity", "reticence", "vanity"],
    correct: "candor",
  },
  {
    id: "tenuous",
    pos: "adj.",
    definition: "very weak or slight; lacking a sound basis or substance",
    options: ["resolute", "tangible", "tenuous", "abundant"],
    correct: "tenuous",
  },
];
