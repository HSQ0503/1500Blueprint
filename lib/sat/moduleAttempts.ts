// Server-only persistence for single-module practice attempts. Uses the
// service-role admin client; callers authorize first. Never import into a
// Client Component.

import { supabaseAdmin } from "@/utils/supabase/admin";
import type { AnswerMap } from "./types";

export type ModuleAttemptInput = {
  testSlug: string;
  moduleKey: string;
  label: string;
  correct: number;
  total: number;
  answers: AnswerMap;
  perQuestionTime: Record<string, number>;
  clientToken?: string;
};

export type ModuleAttemptSummary = {
  id: string;
  moduleKey: string;
  label: string;
  correct: number;
  total: number;
  createdAt: string;
};

export type StoredModuleAttempt = {
  id: string;
  testSlug: string;
  moduleKey: string;
  label: string;
  correct: number;
  total: number;
  answers: AnswerMap;
  perQuestionTime: Record<string, number>;
  createdAt: string;
};

export type ModuleBest = { correct: number; total: number; count: number };

// A second submit for the same module within this window returns the existing row.
const DEDUPE_MS = 10_000;

export async function saveModuleAttempt(
  email: string,
  input: ModuleAttemptInput,
): Promise<string> {
  const db = supabaseAdmin();

  const recent = await db
    .from("module_attempts")
    .select("id,created_at")
    .eq("email", email)
    .eq("test_slug", input.testSlug)
    .eq("module_key", input.moduleKey)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; created_at: string }>();
  if (recent.data && Date.now() - Date.parse(recent.data.created_at) < DEDUPE_MS) {
    return recent.data.id;
  }

  const { data, error } = await db
    .from("module_attempts")
    .insert({
      email,
      test_slug: input.testSlug,
      module_key: input.moduleKey,
      label: input.label,
      correct: input.correct,
      total: input.total,
      answers: input.answers,
      per_question_time: input.perQuestionTime,
      client_token: input.clientToken ?? null,
    })
    .select("id")
    .maybeSingle<{ id: string }>();

  // A unique-token collision means it was already recorded: return that row.
  if (error || !data) {
    if (input.clientToken) {
      const { data: existing } = await db
        .from("module_attempts")
        .select("id")
        .eq("client_token", input.clientToken)
        .maybeSingle<{ id: string }>();
      if (existing) return existing.id;
    }
    if (error) throw error;
  }
  return data?.id ?? "";
}

export async function listModuleAttempts(
  email: string,
  slug: string,
): Promise<ModuleAttemptSummary[]> {
  const { data } = await supabaseAdmin()
    .from("module_attempts")
    .select("id,module_key,label,correct,total,created_at")
    .eq("email", email)
    .eq("test_slug", slug)
    .order("created_at", { ascending: false })
    .returns<
      { id: string; module_key: string; label: string; correct: number; total: number; created_at: string }[]
    >();
  return (data ?? []).map((r) => ({
    id: r.id,
    moduleKey: r.module_key,
    label: r.label,
    correct: r.correct,
    total: r.total,
    createdAt: r.created_at,
  }));
}

export async function getModuleAttempt(
  email: string,
  attemptId: string,
): Promise<StoredModuleAttempt | null> {
  const { data } = await supabaseAdmin()
    .from("module_attempts")
    .select("id,test_slug,module_key,label,correct,total,answers,per_question_time,created_at")
    .eq("email", email)
    .eq("id", attemptId)
    .maybeSingle<{
      id: string;
      test_slug: string;
      module_key: string;
      label: string;
      correct: number;
      total: number;
      answers: AnswerMap | null;
      per_question_time: Record<string, number> | null;
      created_at: string;
    }>();
  if (!data) return null;
  return {
    id: data.id,
    testSlug: data.test_slug,
    moduleKey: data.module_key,
    label: data.label,
    correct: data.correct,
    total: data.total,
    answers: data.answers ?? {},
    perQuestionTime: data.per_question_time ?? {},
    createdAt: data.created_at,
  };
}

// Best attempt (by accuracy) per module key for a test — powers the picker badges.
export async function bestByModuleKey(
  email: string,
  slug: string,
): Promise<Record<string, ModuleBest>> {
  const { data } = await supabaseAdmin()
    .from("module_attempts")
    .select("module_key,correct,total")
    .eq("email", email)
    .eq("test_slug", slug)
    .returns<{ module_key: string; correct: number; total: number }[]>();

  const out: Record<string, ModuleBest> = {};
  for (const r of data ?? []) {
    const cur = out[r.module_key];
    if (!cur) {
      out[r.module_key] = { correct: r.correct, total: r.total, count: 1 };
      continue;
    }
    cur.count += 1;
    if (r.correct / Math.max(1, r.total) > cur.correct / Math.max(1, cur.total)) {
      cur.correct = r.correct;
      cur.total = r.total;
    }
  }
  return out;
}
