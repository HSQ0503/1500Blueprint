// Quizlet-style flashcard sets. Separate from the drills suite's spaced-rep
// "flashcards" drill (lib/drills) — these are user-authored, named sets.

export type SetVisibility = "private" | "shared";

export type FlashcardCard = {
  id: string;
  position: number; // 1-based order within the set
  term: string;
  definition: string;
  // Optional figures (LaTeX lives inline in term/definition via $...$).
  termImageUrl: string | null;
  definitionImageUrl: string | null;
};

// A set without its cards — used for library lists (card count only).
export type FlashcardSet = {
  id: string;
  ownerEmail: string;
  title: string;
  description: string | null;
  visibility: SetVisibility;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
};

export type FlashcardSetWithCards = FlashcardSet & { cards: FlashcardCard[] };

// ---- Client -> server write shapes ----

export type CardInput = {
  term: string;
  definition: string;
  termImageUrl?: string | null;
  definitionImageUrl?: string | null;
};

export type SetInput = {
  title: string;
  description: string | null;
  visibility: SetVisibility;
  cards: CardInput[];
};
