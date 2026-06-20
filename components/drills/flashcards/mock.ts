// Local mock deck for the Vocab Flashcards drill (UI-first, no backend). In the
// real product these cards are saved from the Vocab Drill; here we seed a deck
// so the spaced-repetition review is showable.

export type Flashcard = {
  word: string;
  pos: string;
  definition: string;
  example: string;
};

export const DECK: Flashcard[] = [
  {
    word: "anachronistic",
    pos: "adj.",
    definition: "out of place in time; belonging to a period other than the one portrayed",
    example: "The film was full of anachronistic details, like a Roman soldier wearing a wristwatch.",
  },
  {
    word: "ephemeral",
    pos: "adj.",
    definition: "lasting for a very short time",
    example: "Fame can be ephemeral, fading almost as quickly as it arrives.",
  },
  {
    word: "gregarious",
    pos: "adj.",
    definition: "fond of company; sociable",
    example: "Her gregarious nature made the long bus ride feel short.",
  },
  {
    word: "austere",
    pos: "adj.",
    definition: "severe or plain in manner or appearance; without comfort or luxury",
    example: "The monastery was austere, with bare stone walls and a single wooden bench.",
  },
  {
    word: "pragmatic",
    pos: "adj.",
    definition: "dealing with things practically rather than idealistically",
    example: "She took a pragmatic approach, choosing the plan that could actually be funded.",
  },
  {
    word: "capricious",
    pos: "adj.",
    definition: "given to sudden, unpredictable changes in mood or behavior",
    example: "The capricious weather shifted from sun to hail within an hour.",
  },
  {
    word: "tenuous",
    pos: "adj.",
    definition: "very weak or slight; thin in substance",
    example: "The evidence was tenuous, resting on a single unreliable witness.",
  },
  {
    word: "ubiquitous",
    pos: "adj.",
    definition: "present, appearing, or found everywhere",
    example: "Smartphones have become ubiquitous, glowing in nearly every hand.",
  },
];

export const DUE_COUNT = DECK.length;
