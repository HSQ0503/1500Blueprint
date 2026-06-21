// Server-only data + award layer for the gamification system. Reads/writes the
// Supabase tables (via the service-role admin client) and uses the pure logic in
// engine.ts. Never import this into a Client Component.

import type {
  AchievementItem,
  AchievementsView,
  LeaderRow,
  NavStats,
  Player,
  StreakDay,
} from "@/lib/gamification";
import { supabaseAdmin } from "@/utils/supabase/admin";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  advanceStreak,
  dateKey,
  drillXpFor,
  levelProgress,
  mondayIndex,
  satisfiedAchievements,
  TEST_COMPLETE_XP,
  testBonusXp,
  weekStart,
  type Stats,
} from "./engine";

const SEASON = "Season 4 · Spring Sprint";
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type HubState = {
  player: Player;
  weeklyStreak: StreakDay[];
  todayIndex: number;
  dailyGoal: { done: number; total: number };
  leaderboard: LeaderRow[];
  achievements: AchievementsView;
};

export type AwardOutcome = { xpAwarded: number; newAchievements: string[] };

type UserRow = {
  name: string | null;
  plan: string | null;
  xp: number;
  streak_current: number;
  streak_longest: number;
  last_active_date: string | null;
  daily_goal_target: number;
};

// Derive a friendly display name from a stored name (preferred) or the email.
function identity(email: string, name: string | null): {
  name: string;
  firstName: string;
  initials: string;
} {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    const initials = (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
    return { name: name.trim(), firstName: parts[0], initials };
  }
  const local = email.split("@")[0] ?? email;
  const word = local.split(/[._-]/)[0] || local;
  const firstName = word.charAt(0).toUpperCase() + word.slice(1);
  return { name: firstName, firstName, initials: firstName.slice(0, 2).toUpperCase() };
}

async function loadUser(email: string): Promise<UserRow | null> {
  const { data } = await supabaseAdmin()
    .from("users")
    .select("name,plan,xp,streak_current,streak_longest,last_active_date,daily_goal_target")
    .eq("email", email)
    .maybeSingle<UserRow>();
  return data ?? null;
}

// Assemble everything the hub needs for one student in a single call.
export async function getHubState(email: string): Promise<HubState> {
  const db = supabaseAdmin();
  const now = new Date();
  const today = dateKey(now);
  const weekStartDate = weekStart(now);
  const weekStartIso = weekStartDate.toISOString();

  const user = await loadUser(email);
  const xp = user?.xp ?? 0;
  const prog = levelProgress(xp);
  const id = identity(email, user?.name ?? null);

  // Per-day XP + goal completion for the current week (Mon..Sun). A day is "done"
  // (keeps the flame) when its drill count hits the goal or a test was finished.
  const dailyTarget = user?.daily_goal_target ?? 5;
  const dayIndex = (iso: string) => Math.floor((Date.parse(iso) - weekStartDate.getTime()) / 86_400_000);
  const perDayXp = Array<number>(7).fill(0);
  const perDayDrills = Array<number>(7).fill(0);
  const perDayTests = Array<number>(7).fill(0);

  const [weekEvents, weekDrills, weekTests] = await Promise.all([
    db.from("xp_events").select("amount,created_at").eq("email", email).gte("created_at", weekStartIso).returns<{ amount: number; created_at: string }[]>(),
    db.from("drill_attempts").select("created_at").eq("email", email).gte("created_at", weekStartIso).returns<{ created_at: string }[]>(),
    db.from("test_attempts").select("created_at").eq("email", email).gte("created_at", weekStartIso).returns<{ created_at: string }[]>(),
  ]);
  for (const e of weekEvents.data ?? []) {
    const i = dayIndex(e.created_at);
    if (i >= 0 && i < 7 && e.amount > 0) perDayXp[i] += e.amount;
  }
  for (const r of weekDrills.data ?? []) {
    const i = dayIndex(r.created_at);
    if (i >= 0 && i < 7) perDayDrills[i] += 1;
  }
  for (const r of weekTests.data ?? []) {
    const i = dayIndex(r.created_at);
    if (i >= 0 && i < 7) perDayTests[i] += 1;
  }
  const weeklyStreak: StreakDay[] = WEEKDAYS.map((label, i) => ({
    label,
    xp: perDayXp[i],
    done: perDayDrills[i] >= dailyTarget || perDayTests[i] >= 1,
  }));

  // Daily goal: drills completed today.
  const { count: drillsToday } = await db
    .from("drill_attempts")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", `${today}T00:00:00Z`);

  // Weekly leaderboard.
  const { data: lbData } = await db.rpc("weekly_leaderboard", { p_since: weekStartIso });
  const rows = ((lbData ?? []) as { email: string; weekly_xp: number | string }[]).map((r) => ({
    email: r.email,
    weeklyXp: Number(r.weekly_xp),
  }));
  if (!rows.some((r) => r.email === email)) rows.push({ email, weeklyXp: 0 });
  rows.sort((a, b) => b.weeklyXp - a.weeklyXp);
  const myIndex = rows.findIndex((r) => r.email === email);
  const rival = myIndex > 0 ? rows[myIndex - 1] : null;
  const leaderboard: LeaderRow[] = rows.slice(0, 5).map((r, i) => {
    const you = r.email === email;
    const who = identity(r.email, null);
    return {
      rank: i + 1,
      name: you ? "You" : who.name,
      xp: r.weeklyXp.toLocaleString(),
      initials: who.initials,
      you,
    };
  });

  // Achievements: read persisted unlocks; the catalog supplies labels + descriptions.
  const { data: ua } = await db
    .from("user_achievements")
    .select("achievement_id")
    .eq("email", email)
    .returns<{ achievement_id: string }[]>();
  const unlocked = new Set((ua ?? []).map((r) => r.achievement_id));
  const achievementItems: AchievementItem[] = ACHIEVEMENTS.map((a) => ({
    id: a.id,
    label: a.label,
    description: a.description,
    category: a.category,
    unlocked: unlocked.has(a.id),
  }));
  const achievementCategories = ACHIEVEMENT_CATEGORIES.map((c) => {
    const inCat = achievementItems.filter((i) => i.category === c.key);
    return {
      key: c.key,
      label: c.label,
      unlocked: inCat.filter((i) => i.unlocked).length,
      total: inCat.length,
    };
  });
  const nextUp = achievementItems.find((i) => !i.unlocked) ?? null;

  const player: Player = {
    name: id.name,
    firstName: id.firstName,
    initials: id.initials,
    level: prog.level,
    xp,
    xpForNextLevel: prog.ceil,
    streak: user?.streak_current ?? 0,
    plan: user?.plan ?? "1500 Club",
    rank: myIndex + 1,
    season: SEASON,
    rivalName: rival ? identity(rival.email, null).firstName : "the top spot",
    xpBehindRival: rival ? Math.max(0, rival.weeklyXp - rows[myIndex].weeklyXp) : 0,
  };

  return {
    player,
    weeklyStreak,
    todayIndex: mondayIndex(now),
    dailyGoal: { done: drillsToday ?? 0, total: dailyTarget },
    leaderboard,
    achievements: {
      unlocked: unlocked.size,
      total: ACHIEVEMENTS.length,
      categories: achievementCategories,
      items: achievementItems,
      nextUp,
    },
  };
}

// Compute the full stat snapshot used to evaluate achievements.
async function computeStats(email: string, user: UserRow): Promise<Stats> {
  const db = supabaseAdmin();
  const [drills, tests, perfect, best, days] = await Promise.all([
    db.from("drill_attempts").select("id", { count: "exact", head: true }).eq("email", email),
    db.from("test_attempts").select("id", { count: "exact", head: true }).eq("email", email),
    db.from("drill_attempts").select("id", { count: "exact", head: true }).eq("email", email).eq("score", 100),
    db.from("test_attempts").select("total_score").eq("email", email).order("total_score", { ascending: false }).limit(1).maybeSingle<{ total_score: number | null }>(),
    db.from("drill_attempts").select("created_at").eq("email", email).returns<{ created_at: string }[]>(),
  ]);

  const byDay: Record<string, number> = {};
  for (const r of days.data ?? []) {
    const k = r.created_at.slice(0, 10);
    byDay[k] = (byDay[k] ?? 0) + 1;
  }
  const dailyGoalsHit = Object.values(byDay).filter((c) => c >= user.daily_goal_target).length;

  const prog = levelProgress(user.xp);
  return {
    xp: user.xp,
    level: prog.level,
    streakCurrent: user.streak_current,
    streakLongest: user.streak_longest,
    drillsCompleted: drills.count ?? 0,
    testsCompleted: tests.count ?? 0,
    dailyGoalsHit,
    bestTestScore: best.data?.total_score ?? 0,
    perfectDrills: perfect.count ?? 0,
  };
}

// Credit a streak DAY only once the daily goal is met (or a test is finished).
// Consistency keeps the flame — a single low-graded rep does not.
async function creditStreak(email: string): Promise<void> {
  const db = supabaseAdmin();
  const user = await loadUser(email);
  if (!user) return;
  const today = dateKey(new Date());
  if (user.last_active_date === today) return; // already credited today

  const startIso = `${today}T00:00:00Z`;
  const [drills, tests] = await Promise.all([
    db.from("drill_attempts").select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", startIso),
    db.from("test_attempts").select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", startIso),
  ]);
  const goalMet = (drills.count ?? 0) >= user.daily_goal_target || (tests.count ?? 0) >= 1;
  if (!goalMet) return;

  const res = advanceStreak(user.streak_current, user.streak_longest, user.last_active_date, today);
  await db
    .from("users")
    .update({ streak_current: res.streak, streak_longest: res.longest, last_active_date: today })
    .eq("email", email);
}

// Persist any achievements the current stats newly satisfy; return the new ids.
async function unlockNewAchievements(email: string): Promise<string[]> {
  const db = supabaseAdmin();
  const user = await loadUser(email);
  if (!user) return [];
  const stats = await computeStats(email, user);
  const satisfied = satisfiedAchievements(stats);
  const { data: existing } = await db
    .from("user_achievements")
    .select("achievement_id")
    .eq("email", email)
    .returns<{ achievement_id: string }[]>();
  const have = new Set((existing ?? []).map((r) => r.achievement_id));
  const newly = satisfied.filter((id) => !have.has(id));
  if (newly.length) {
    await db.from("user_achievements").insert(newly.map((achievement_id) => ({ email, achievement_id })));
  }
  return newly;
}

export type DrillResult = {
  drillSlug: string;
  correct?: number | null;
  total?: number | null;
  score?: number | null; // 0..100
};

// Record a completed drill, award XP, advance the streak, unlock achievements.
export async function awardDrill(email: string, result: DrillResult): Promise<AwardOutcome> {
  const db = supabaseAdmin();
  // Quality drives XP: the AI grade for graded drills, accuracy for objective ones.
  const quality =
    result.score ?? (result.total ? Math.round(((result.correct ?? 0) / result.total) * 100) : null);
  const amount = drillXpFor(result.drillSlug, quality);

  await db.from("drill_attempts").insert({
    email,
    drill_slug: result.drillSlug,
    correct: result.correct ?? null,
    total: result.total ?? null,
    score: quality,
    xp_awarded: amount,
  });
  await db.from("xp_events").insert({ email, amount, reason: "drill", ref: result.drillSlug });
  await db.rpc("add_xp", { p_email: email, p_amount: amount });
  await creditStreak(email);
  const newAchievements = await unlockNewAchievements(email);
  return { xpAwarded: amount, newAchievements };
}

export type TestResultInput = {
  testSlug: string;
  totalScore: number;
  rwScore?: number;
  mathScore?: number;
};

// Record a completed practice test, award XP, advance the streak, unlock achievements.
export async function awardTest(email: string, input: TestResultInput): Promise<AwardOutcome> {
  const db = supabaseAdmin();
  const amount = TEST_COMPLETE_XP + testBonusXp(input.totalScore);

  await db.from("test_attempts").insert({
    email,
    test_slug: input.testSlug,
    total_score: input.totalScore,
    rw_score: input.rwScore ?? null,
    math_score: input.mathScore ?? null,
    xp_awarded: amount,
  });
  await db.from("xp_events").insert({ email, amount, reason: "test", ref: input.testSlug });
  await db.rpc("add_xp", { p_email: email, p_amount: amount });
  await creditStreak(email);
  const newAchievements = await unlockNewAchievements(email);
  return { xpAwarded: amount, newAchievements };
}

/* ------------------------------ Onboarding ------------------------------ */

export async function needsOnboarding(email: string): Promise<boolean> {
  const { data } = await supabaseAdmin()
    .from("users")
    .select("onboarded_at")
    .eq("email", email)
    .maybeSingle<{ onboarded_at: string | null }>();
  return !data?.onboarded_at;
}

export async function markOnboarded(email: string): Promise<void> {
  await supabaseAdmin()
    .from("users")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("email", email);
}

/* ------------------------------ Test picker ----------------------------- */

export type TestProgress = {
  bestScore: number | null;
  testsDone: number;
  improvement: number | null; // best minus first
  bestBySlug: Record<string, number>;
};

export async function getTestProgress(email: string): Promise<TestProgress> {
  const { data } = await supabaseAdmin()
    .from("test_attempts")
    .select("test_slug,total_score,created_at")
    .eq("email", email)
    .order("created_at", { ascending: true })
    .returns<{ test_slug: string; total_score: number | null; created_at: string }[]>();

  const rows = data ?? [];
  const scores = rows.map((r) => r.total_score).filter((n): n is number => typeof n === "number");
  const bestScore = scores.length ? Math.max(...scores) : null;
  const firstScore = scores.length ? scores[0] : null;
  const bestBySlug: Record<string, number> = {};
  for (const r of rows) {
    if (typeof r.total_score === "number") {
      bestBySlug[r.test_slug] = Math.max(bestBySlug[r.test_slug] ?? 0, r.total_score);
    }
  }
  return {
    bestScore,
    testsDone: rows.length,
    improvement: bestScore != null && firstScore != null ? bestScore - firstScore : null,
    bestBySlug,
  };
}

/* ---------------------------------- Nav --------------------------------- */

// Lightweight stats for the shared top nav, without the full hub query.
export async function getNavStats(email: string): Promise<NavStats> {
  const user = await loadUser(email);
  const xp = user?.xp ?? 0;
  const id = identity(email, user?.name ?? null);
  return {
    streak: user?.streak_current ?? 0,
    level: levelProgress(xp).level,
    xp,
    name: id.name,
    initials: id.initials,
    plan: user?.plan ?? "1500 Club",
  };
}
