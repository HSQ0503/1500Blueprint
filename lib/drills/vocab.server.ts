import "server-only";

import type { Flashcard } from "@/components/drills/flashcards/mock";
import { awardDrill, type AwardOutcome } from "@/lib/gamification/state";
import { supabaseAdmin } from "@/utils/supabase/admin";
import type { VocabContent } from "./types";
import {
  advanceVocabProgress,
  summarizeVocabAttempts,
  type VocabAnswerResult,
  type VocabDashboardState,
} from "./vocabProgress";

const VOCAB_SET_TITLE = "Vocab Drill Saves";

type VocabQuestionRow = { id: string; content: Record<string, unknown> | null };
type VocabSetRow = { id: string; description: string | null };
type VocabCardRow = { id: string; position: number; term: string; definition: string };
type StoredVocabState = { currentStreak: number; bestStreak: number; autoAdd: boolean };

const DEFAULT_STATE: StoredVocabState = { currentStreak: 0, bestStreak: 0, autoAdd: true };

function databaseError(action: string, error: { message: string; code?: string }): Error {
  const code = error.code ? ` [${error.code}]` : "";
  return new Error(`${action}${code}: ${error.message}`);
}

function vocabContent(row: VocabQuestionRow): VocabContent {
  return (row.content ?? {}) as VocabContent;
}

function correctWord(row: VocabQuestionRow): string | null {
  const content = vocabContent(row);
  if (!Array.isArray(content.options)) return null;
  return content.options[content.correctIndex] ?? null;
}

function stateDescription(state: StoredVocabState): string {
  return `Saved automatically from the Vocab Drill. Current streak: ${state.currentStreak}. Best streak: ${state.bestStreak}. Auto-add: ${state.autoAdd ? "on" : "off"}.`;
}

function parseState(description: string | null): StoredVocabState {
  const match = description?.match(
    /Current streak: (\d+)\. Best streak: (\d+)\. Auto-add: (on|off)\./i,
  );
  return match
    ? {
        currentStreak: Number(match[1]),
        bestStreak: Number(match[2]),
        autoAdd: match[3].toLowerCase() === "on",
      }
    : DEFAULT_STATE;
}

function encodeDefinition(content: VocabContent): string {
  const lines = [`Definition: ${content.definition ?? ""}`];
  if (content.pos) lines.unshift(`Part of speech: ${content.pos}`);
  if (content.example) lines.push(`Example: ${content.example}`);
  return lines.join("\n");
}

function decodeDefinition(value: string): Omit<Flashcard, "word"> {
  const pos = value.match(/^Part of speech:\s*(.+)$/m)?.[1]?.trim() ?? "";
  const definition = value.match(/^Definition:\s*(.+)$/m)?.[1]?.trim() ?? value;
  const example = value.match(/^Example:\s*(.+)$/m)?.[1]?.trim() ?? "";
  return { pos, definition, example };
}

async function loadQuestion(questionId: string): Promise<VocabQuestionRow> {
  const { data, error } = await supabaseAdmin()
    .from("drill_questions")
    .select("id,content")
    .eq("id", questionId)
    .eq("drill_slug", "vocab")
    .eq("status", "published")
    .maybeSingle<VocabQuestionRow>();
  if (error) throw databaseError("Could not load vocab question", error);
  if (!data || !correctWord(data)) throw new Error("Vocab question was not found.");
  return data;
}

async function loadVocabSet(email: string): Promise<VocabSetRow | null> {
  const { data, error } = await supabaseAdmin()
    .from("flashcard_sets")
    .select("id,description")
    .eq("owner_email", email)
    .eq("title", VOCAB_SET_TITLE)
    .eq("visibility", "private")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<VocabSetRow>();
  if (error) throw databaseError("Could not load the Vocab Flashcards deck", error);
  return data ?? null;
}

async function ensureVocabSet(email: string): Promise<VocabSetRow> {
  const existing = await loadVocabSet(email);
  if (existing) return existing;
  const { data, error } = await supabaseAdmin()
    .from("flashcard_sets")
    .insert({
      owner_email: email,
      title: VOCAB_SET_TITLE,
      description: stateDescription(DEFAULT_STATE),
      visibility: "private",
    })
    .select("id,description")
    .single<VocabSetRow>();
  if (error || !data) throw databaseError("Could not create the Vocab Flashcards deck", error ?? { message: "No row returned" });
  return data;
}

async function saveStoredState(email: string, state: StoredVocabState): Promise<VocabSetRow> {
  const set = await ensureVocabSet(email);
  const description = stateDescription(state);
  const { error } = await supabaseAdmin()
    .from("flashcard_sets")
    .update({ description })
    .eq("id", set.id)
    .eq("owner_email", email);
  if (error) throw databaseError("Could not save vocab settings", error);
  return { ...set, description };
}

async function loadCards(setId: string): Promise<VocabCardRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("flashcard_cards")
    .select("id,position,term,definition")
    .eq("set_id", setId)
    .order("position")
    .returns<VocabCardRow[]>();
  if (error) throw databaseError("Could not load Vocab Flashcards", error);
  return data ?? [];
}

async function saveQuestionAsFlashcard(email: string, question: VocabQuestionRow): Promise<void> {
  const set = await ensureVocabSet(email);
  const content = vocabContent(question);
  const word = correctWord(question);
  if (!word) throw new Error("Vocab question has no correct word.");
  const db = supabaseAdmin();
  const { data: existing, error: existingError } = await db
    .from("flashcard_cards")
    .select("id")
    .eq("set_id", set.id)
    .ilike("term", word)
    .limit(1)
    .maybeSingle<{ id: string }>();
  if (existingError) throw databaseError("Could not inspect Vocab Flashcards", existingError);
  if (existing) {
    const { error } = await db
      .from("flashcard_cards")
      .update({ term: word, definition: encodeDefinition(content) })
      .eq("id", existing.id)
      .eq("set_id", set.id);
    if (error) throw databaseError("Could not update the vocab flashcard", error);
    return;
  }

  const { data: last, error: lastError } = await db
    .from("flashcard_cards")
    .select("position")
    .eq("set_id", set.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle<{ position: number }>();
  if (lastError) throw databaseError("Could not prepare the vocab flashcard", lastError);
  const { error } = await db.from("flashcard_cards").insert({
    set_id: set.id,
    position: (last?.position ?? 0) + 1,
    term: word,
    definition: encodeDefinition(content),
  });
  if (error) throw databaseError("Could not save the vocab flashcard", error);
}

async function loadAllVocabQuestionRows(): Promise<VocabQuestionRow[]> {
  const rows: VocabQuestionRow[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabaseAdmin()
      .from("drill_questions")
      .select("id,content")
      .eq("drill_slug", "vocab")
      .eq("status", "published")
      .order("created_at")
      .range(from, from + pageSize - 1)
      .returns<VocabQuestionRow[]>();
    if (error) throw databaseError("Could not load vocab words", error);
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < pageSize) return rows;
  }
}

export async function loadVocabDashboard(email: string): Promise<VocabDashboardState> {
  const db = supabaseAdmin();
  const [questions, progressRes, attemptsRes, set] = await Promise.all([
    loadAllVocabQuestionRows(),
    db
      .from("drill_question_progress")
      .select("question_id,attempts,best_score,mastered_at")
      .eq("email", email)
      .eq("drill_slug", "vocab")
      .order("last_seen_at", { ascending: false })
      .returns<{
        question_id: string;
        attempts: number;
        best_score: number | null;
        mastered_at: string | null;
      }[]>(),
    db
      .from("module_attempts")
      .select("correct,total,per_question_time,created_at")
      .eq("email", email)
      .eq("test_slug", "vocab")
      .eq("module_key", "vocab-drill")
      .order("created_at", { ascending: true })
      .returns<{
        correct: number;
        total: number;
        per_question_time: { durationSeconds?: number } | null;
        created_at: string;
      }[]>(),
    loadVocabSet(email),
  ]);
  if (progressRes.error) throw databaseError("Could not load vocab progress", progressRes.error);
  if (attemptsRes.error) throw databaseError("Could not load vocab attempts", attemptsRes.error);

  const cards = set ? await loadCards(set.id) : [];
  const state = parseState(set?.description ?? null);
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const questionIdByWord = new Map(
    questions.flatMap((question) => {
      const word = correctWord(question);
      return word ? [[word.toLocaleLowerCase(), question.id] as const] : [];
    }),
  );
  const progress = progressRes.data ?? [];

  return {
    totalWords: questions.length,
    masteredCount: progress.filter((row) => row.mastered_at).length,
    currentStreak: state.currentStreak,
    bestStreak: state.bestStreak,
    autoAddFlashcards: state.autoAdd,
    savedQuestionIds: cards.flatMap((card) => {
      const id = questionIdByWord.get(card.term.toLocaleLowerCase());
      return id ? [id] : [];
    }),
    flashcardCount: cards.length,
    words: progress.flatMap((row) => {
      const question = questionById.get(row.question_id);
      const word = question ? correctWord(question) : null;
      return word
        ? [{
            questionId: row.question_id,
            word,
            correctStreak: row.best_score ?? 0,
            mastered: Boolean(row.mastered_at),
          }]
        : [];
    }),
    attempts: summarizeVocabAttempts(
      (attemptsRes.data ?? []).map((row) => ({
        correct: row.correct,
        total: row.total,
        durationSeconds: row.per_question_time?.durationSeconds ?? 0,
      })),
    ),
  };
}

export async function recordVocabAnswer(
  email: string,
  input: { questionId: string; selectedWord: string },
): Promise<VocabAnswerResult> {
  const db = supabaseAdmin();
  const question = await loadQuestion(input.questionId);
  const content = vocabContent(question);
  const answer = correctWord(question) as string;
  if (!content.options.includes(input.selectedWord)) throw new Error("Selected word is not an answer choice.");
  const isCorrect = input.selectedWord === answer;

  const [set, progressRes] = await Promise.all([
    loadVocabSet(email),
    db
      .from("drill_question_progress")
      .select("attempts,best_score,mastered_at")
      .eq("email", email)
      .eq("question_id", input.questionId)
      .maybeSingle<{ attempts: number; best_score: number | null; mastered_at: string | null }>(),
  ]);
  if (progressRes.error) throw databaseError("Could not load word progress", progressRes.error);
  const stored = parseState(set?.description ?? null);
  const next = advanceVocabProgress(
    {
      wordCorrectStreak: progressRes.data?.best_score ?? 0,
      currentStreak: stored.currentStreak,
      bestStreak: stored.bestStreak,
      mastered: Boolean(progressRes.data?.mastered_at),
    },
    isCorrect,
  );
  const now = new Date().toISOString();
  const masteredAt = progressRes.data?.mastered_at ?? (next.mastered ? now : null);

  const [progressWrite] = await Promise.all([
    db.from("drill_question_progress").upsert(
      {
        email,
        question_id: input.questionId,
        drill_slug: "vocab",
        attempts: (progressRes.data?.attempts ?? 0) + 1,
        best_score: next.wordCorrectStreak,
        mastered_at: masteredAt,
        last_seen_at: now,
      },
      { onConflict: "email,question_id" },
    ),
    saveStoredState(email, {
      currentStreak: next.currentStreak,
      bestStreak: next.bestStreak,
      autoAdd: stored.autoAdd,
    }),
  ]);
  if (progressWrite.error) throw databaseError("Could not save word progress", progressWrite.error);

  let autoAdded = false;
  if (!isCorrect && stored.autoAdd) {
    await saveQuestionAsFlashcard(email, question);
    autoAdded = true;
  }
  const masteredRes = await db
    .from("drill_question_progress")
    .select("question_id", { count: "exact", head: true })
    .eq("email", email)
    .eq("drill_slug", "vocab")
    .not("mastered_at", "is", null);
  if (masteredRes.error) throw databaseError("Could not count mastered vocab words", masteredRes.error);

  return {
    correct: isCorrect,
    correctWord: answer,
    wordCorrectStreak: next.wordCorrectStreak,
    mastered: next.mastered,
    masteredCount: masteredRes.count ?? 0,
    currentStreak: next.currentStreak,
    bestStreak: next.bestStreak,
    autoAdded,
  };
}

export async function updateVocabAutoAdd(email: string, enabled: boolean): Promise<void> {
  const set = await loadVocabSet(email);
  const state = parseState(set?.description ?? null);
  await saveStoredState(email, { ...state, autoAdd: enabled });
}

export async function saveVocabFlashcard(email: string, questionId: string): Promise<void> {
  await saveQuestionAsFlashcard(email, await loadQuestion(questionId));
}

export async function removeVocabFlashcard(email: string, questionId: string): Promise<void> {
  const [set, question] = await Promise.all([loadVocabSet(email), loadQuestion(questionId)]);
  if (!set) return;
  const word = correctWord(question);
  if (!word) return;
  const { error } = await supabaseAdmin()
    .from("flashcard_cards")
    .delete()
    .eq("set_id", set.id)
    .ilike("term", word);
  if (error) throw databaseError("Could not remove the vocab flashcard", error);
}

export async function loadVocabFlashcards(email: string): Promise<Flashcard[]> {
  const set = await loadVocabSet(email);
  if (!set) return [];
  return (await loadCards(set.id)).map((card) => ({
    word: card.term,
    ...decodeDefinition(card.definition),
  }));
}

export async function completeVocabSession(
  email: string,
  input: { correct: number; total: number; durationSeconds: number; clientToken: string },
): Promise<AwardOutcome> {
  const db = supabaseAdmin();
  const { error } = await db.from("module_attempts").insert({
    email,
    test_slug: "vocab",
    module_key: "vocab-drill",
    label: "Vocab Drill — 7 words",
    correct: input.correct,
    total: input.total,
    per_question_time: { durationSeconds: input.durationSeconds },
    client_token: input.clientToken,
  });
  if (error) {
    const { data: existing } = await db
      .from("module_attempts")
      .select("id")
      .eq("client_token", input.clientToken)
      .maybeSingle<{ id: string }>();
    if (existing) return { xpAwarded: 0, newAchievements: [] };
    throw databaseError("Could not save vocab session", error);
  }
  return awardDrill(email, {
    drillSlug: "vocab",
    correct: input.correct,
    total: input.total,
  });
}
