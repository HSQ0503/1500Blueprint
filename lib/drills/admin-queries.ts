// Server-only data access for the drill CMS. Every function uses the service-
// role client (bypasses RLS), so this module must NEVER be imported into a
// Client Component. Callers (admin pages + route handlers) authorize with
// getAdminSession() first. Rows are mapped snake_case -> camelCase here so the
// rest of the app only ever sees the typed shapes from ./types.

import { supabaseAdmin } from "@/utils/supabase/admin";
import type { Difficulty } from "@/lib/sat/types";
import type {
  AnswerType,
  DrillCategory,
  DrillConfig,
  DrillContent,
  DrillQuestion,
  DrillSlug,
  QuestionStatus,
  SatSection,
  SatSkill,
  WalkthroughKind,
  WalkthroughStep,
} from "./types";
import type { Accent, AiRole } from "./types";

// ---- Row shapes (as returned by PostgREST) -------------------------------

type DrillRow = {
  slug: string;
  title: string;
  category: string;
  accent: string;
  uses_ai: boolean;
  ai_role: string;
  answer_types: string[];
  grading_prompt: string | null;
  scoring_config: Record<string, unknown> | null;
  sort: number;
};

type QuestionRow = {
  id: string;
  drill_slug: string;
  section: string | null;
  domain: string | null;
  skill: string | null;
  difficulty: string;
  answer_type: string;
  stem: string | null;
  passage: string | null;
  figure_url: string | null;
  content: Record<string, unknown> | null;
  explanation: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type StepRow = {
  id: string;
  question_id: string;
  position: number;
  kind: string;
  text: string;
  detail: string | null;
};

type SkillRow = { id: string; section: string; domain: string; name: string; sort: number };

// ---- Mappers --------------------------------------------------------------

function toDrill(r: DrillRow): DrillConfig {
  return {
    slug: r.slug as DrillSlug,
    title: r.title,
    category: r.category as DrillCategory,
    accent: r.accent as Accent,
    usesAi: r.uses_ai,
    aiRole: r.ai_role as AiRole,
    answerTypes: (r.answer_types ?? []) as AnswerType[],
    gradingPrompt: r.grading_prompt,
    scoringConfig: r.scoring_config ?? {},
  };
}

function toStep(r: StepRow): WalkthroughStep {
  return {
    id: r.id,
    position: r.position,
    kind: r.kind as WalkthroughKind,
    text: r.text,
    detail: r.detail ?? undefined,
  };
}

function toQuestion(r: QuestionRow, steps: StepRow[] = []): DrillQuestion {
  return {
    id: r.id,
    drillSlug: r.drill_slug as DrillSlug,
    section: (r.section as SatSection | null) ?? null,
    domain: r.domain,
    skill: r.skill,
    difficulty: (r.difficulty ?? "medium") as Difficulty,
    answerType: r.answer_type as AnswerType,
    stem: r.stem,
    passage: r.passage,
    figureUrl: r.figure_url,
    content: (r.content ?? {}) as DrillContent,
    explanation: r.explanation,
    status: r.status as QuestionStatus,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    walkthrough: steps
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(toStep),
  };
}

function toSkill(r: SkillRow): SatSkill {
  return { id: r.id, section: r.section as SatSection, domain: r.domain, name: r.name, sort: r.sort };
}

// ---- Reference data -------------------------------------------------------

export async function listSkills(): Promise<SatSkill[]> {
  const { data, error } = await supabaseAdmin()
    .from("sat_skills")
    .select("id,section,domain,name,sort")
    .order("section")
    .order("domain")
    .order("sort");
  if (error || !data) return [];
  return (data as SkillRow[]).map(toSkill);
}

export async function listDrills(): Promise<DrillConfig[]> {
  const { data, error } = await supabaseAdmin()
    .from("drills")
    .select("slug,title,category,accent,uses_ai,ai_role,answer_types,grading_prompt,scoring_config,sort")
    .order("sort");
  if (error || !data) return [];
  return (data as DrillRow[]).map(toDrill);
}

export async function getDrill(slug: string): Promise<DrillConfig | null> {
  const { data, error } = await supabaseAdmin()
    .from("drills")
    .select("slug,title,category,accent,uses_ai,ai_role,answer_types,grading_prompt,scoring_config,sort")
    .eq("slug", slug)
    .maybeSingle<DrillRow>();
  if (error || !data) return null;
  return toDrill(data);
}

export type DrillUpdate = {
  title?: string;
  category?: DrillCategory;
  accent?: Accent;
  gradingPrompt?: string | null;
  scoringConfig?: Record<string, unknown>;
};

export async function updateDrill(slug: string, patch: DrillUpdate): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.accent !== undefined) row.accent = patch.accent;
  if (patch.gradingPrompt !== undefined) row.grading_prompt = patch.gradingPrompt;
  if (patch.scoringConfig !== undefined) row.scoring_config = patch.scoringConfig;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabaseAdmin().from("drills").update(row).eq("slug", slug);
  if (error) throw new Error(`updateDrill failed: ${error.message}`);
}

// ---- Question bank list (filters + pagination) ----------------------------

export type QuestionFilters = {
  drillSlug?: DrillSlug;
  difficulty?: Difficulty;
  answerType?: AnswerType;
  status?: QuestionStatus;
  section?: SatSection;
  skill?: string;
  search?: string;
};

export type QuestionListResult = { questions: DrillQuestion[]; total: number };

export async function listQuestions(
  filters: QuestionFilters = {},
  page = 1,
  pageSize = 25,
): Promise<QuestionListResult> {
  let query = supabaseAdmin()
    .from("drill_questions")
    .select(
      "id,drill_slug,section,domain,skill,difficulty,answer_type,stem,passage,figure_url,content,explanation,status,created_by,created_at,updated_at",
      { count: "exact" },
    );

  if (filters.drillSlug) query = query.eq("drill_slug", filters.drillSlug);
  if (filters.difficulty) query = query.eq("difficulty", filters.difficulty);
  if (filters.answerType) query = query.eq("answer_type", filters.answerType);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.section) query = query.eq("section", filters.section);
  if (filters.skill) query = query.eq("skill", filters.skill);
  if (filters.search) {
    // Strip PostgREST logic-tree metacharacters so a search term can't break out
    // of the ilike value in the .or() expression (%, comma, parens, star).
    const s = filters.search.replace(/[%,()*]/g, " ").trim();
    if (s) query = query.or(`stem.ilike.%${s}%,passage.ilike.%${s}%`);
  }

  const from = (Math.max(1, page) - 1) * pageSize;
  const { data, error, count } = await query
    .order("updated_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error || !data) return { questions: [], total: 0 };
  return { questions: (data as QuestionRow[]).map((r) => toQuestion(r)), total: count ?? 0 };
}

// ---- Single question (with walkthrough) -----------------------------------

export async function getQuestion(id: string): Promise<DrillQuestion | null> {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("drill_questions")
    .select(
      "id,drill_slug,section,domain,skill,difficulty,answer_type,stem,passage,figure_url,content,explanation,status,created_by,created_at,updated_at",
    )
    .eq("id", id)
    .maybeSingle<QuestionRow>();
  if (error || !data) return null;

  const { data: steps } = await admin
    .from("drill_walkthrough_steps")
    .select("id,question_id,position,kind,text,detail")
    .eq("question_id", id)
    .order("position");

  return toQuestion(data, (steps as StepRow[] | null) ?? []);
}

// ---- Create / update / delete ---------------------------------------------

// Insert a blank draft for a drill and return it. answer_type defaults to the
// drill's first allowed type so the editor opens on a valid item.
export async function createQuestion(
  drillSlug: DrillSlug,
  createdBy: string | null,
): Promise<DrillQuestion | null> {
  const drill = await getDrill(drillSlug);
  const answerType = (drill?.answerTypes[0] ?? "mc_single") as AnswerType;
  const { data, error } = await supabaseAdmin()
    .from("drill_questions")
    .insert({ drill_slug: drillSlug, answer_type: answerType, status: "draft", created_by: createdBy })
    .select(
      "id,drill_slug,section,domain,skill,difficulty,answer_type,stem,passage,figure_url,content,explanation,status,created_by,created_at,updated_at",
    )
    .single<QuestionRow>();
  if (error || !data) return null;
  return toQuestion(data);
}

export type QuestionInput = {
  id: string;
  section: SatSection | null;
  domain: string | null;
  skill: string | null;
  difficulty: Difficulty;
  answerType: AnswerType;
  stem: string | null;
  passage: string | null;
  figureUrl: string | null;
  content: DrillContent;
  explanation: string | null;
  status: QuestionStatus;
};

export async function updateQuestion(input: QuestionInput): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("drill_questions")
    .update({
      section: input.section,
      domain: input.domain,
      skill: input.skill,
      difficulty: input.difficulty,
      answer_type: input.answerType,
      stem: input.stem,
      passage: input.passage,
      figure_url: input.figureUrl,
      content: input.content,
      explanation: input.explanation,
      status: input.status,
    })
    .eq("id", input.id);
  if (error) throw new Error(`updateQuestion failed: ${error.message}`);
}

export type WalkthroughStepInput = {
  position: number;
  kind: WalkthroughKind;
  text: string;
  detail?: string | null;
};

// Replace all steps for a question (delete-all-then-insert), mirroring the
// cascade-replace idempotency the test importer uses for modules.
export async function replaceWalkthrough(
  questionId: string,
  steps: WalkthroughStepInput[],
): Promise<void> {
  const admin = supabaseAdmin();
  const del = await admin.from("drill_walkthrough_steps").delete().eq("question_id", questionId);
  if (del.error) throw new Error(`replaceWalkthrough(delete) failed: ${del.error.message}`);
  if (steps.length === 0) return;
  const rows = steps.map((s, i) => ({
    question_id: questionId,
    position: s.position ?? i + 1,
    kind: s.kind,
    text: s.text,
    detail: s.detail ?? null,
  }));
  const ins = await admin.from("drill_walkthrough_steps").insert(rows);
  if (ins.error) throw new Error(`replaceWalkthrough(insert) failed: ${ins.error.message}`);
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabaseAdmin().from("drill_questions").delete().eq("id", id);
  if (error) throw new Error(`deleteQuestion failed: ${error.message}`);
}
