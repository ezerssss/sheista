import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser, getProfile } from "@/lib/supabase/auth";
import { computeStreakFromDays, type StreakResult } from "@/lib/themecp/streak";
import { buildPracticeDayCounts } from "@/lib/themecp/practice-days";
import {
  dayKeyInTz,
  diffDayKeys,
  shiftDayKey,
  todayKey as computeTodayKey,
} from "@/lib/time/day-key";

export type GateCandidate = {
  contest_id: number;
  problem_index: string;
  problem_name: string;
  rating: number;
};

export type OpenUpsolveItem = {
  contest_id: number;
  problem_index: string;
  problem_name: string;
  rating: number | null;
  tags: string[];
};

export type TrainingRow = {
  started_at: string;
  finished_at: string;
  performance: number;
  is_ak: boolean;
  level_at_start: number;
  level_at_end: number;
  tag_filter: string[];
};

export type UserStats = {
  userId: string;
  profile: {
    cf_handle: string;
    cf_rating: number | null;
    level: number;
  };
  timezone: string;
  todayKey: string;
  trainings: TrainingRow[];
  // Practice streak: any real problem counts (bite, upsolve, or round).
  streak: StreakResult;
  // Problems practiced per day key (round = 4, bite/upsolve = 1 each).
  practiceDayCounts: Map<string, number>;
  todayBiteDone: boolean;
  todayRoundDone: boolean;
  // Unsolved upsolve queue, easiest first — the daily bite's first source.
  openUpsolve: OpenUpsolveItem[];
  // Most recent practice of any kind; lastFinishedAt below stays rounds-only.
  lastPracticeAt: string | null;
  daysIdle: number;
  totalRounds: number;
  totalAk: number;
  akRate: number;
  avgRecentPerf: number;
  recentPerf: number[];
  lastFinishedAt: string | null;
  gateCandidates: GateCandidate[];
  gateBlocked: boolean;
  recentHeatmap: { date: string; count: number }[];
  // Lowest-AK-rate tag with at least 3 themed rounds. Null when the user has
  // not yet built up enough history for the heuristic — caller should fall
  // back to a weighted random tag.
  weakestTag: string | null;
};

function buildRecentHeatmap(
  counts: Map<string, number>,
  days: number,
  today: string,
): { date: string; count: number }[] {
  const out: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const k = shiftDayKey(today, -i);
    out.push({ date: k, count: counts.get(k) ?? 0 });
  }
  return out;
}

type PrevProblem = {
  contest_id: number;
  problem_index: string;
  problem_name: string;
  rating: number;
  solved_at: string | null;
};

export const getUserStats = cache(async (): Promise<UserStats | null> => {
  const user = await getAuthedUser();
  if (!user) return null;

  const profile = await getProfile();
  if (!profile?.cf_handle) return null;

  const supabase = await createClient();

  // Parallelize the table reads — they don't depend on each other.
  const [trainingsRes, lastTrainingsRes, dailySolvesRes, upsolveRes] = await Promise.all([
    supabase
      .from("trainings")
      .select(
        "started_at, finished_at, performance, is_ak, level_at_start, level_at_end, tag_filter",
      )
      .eq("user_id", user.id)
      .order("finished_at", { ascending: false })
      .limit(365),
    supabase
      .from("trainings")
      .select(
        "training_problems(contest_id, problem_index, problem_name, rating, solved_at)",
      )
      .eq("user_id", user.id)
      .order("finished_at", { ascending: false })
      .limit(1),
    supabase
      .from("daily_solves")
      .select("day_key, contest_id, problem_index, solved_at")
      .eq("user_id", user.id)
      .order("day_key", { ascending: false })
      .limit(365),
    supabase
      .from("upsolve_problems")
      .select("contest_id, problem_index, problem_name, rating, tags, solved_at")
      .eq("user_id", user.id),
  ]);

  const trainingRows: TrainingRow[] = trainingsRes.data ?? [];
  const timezone = profile.timezone ?? "UTC";
  const tKey = computeTodayKey(timezone);

  const dailySolves = dailySolvesRes.data ?? [];
  const upsolveRows = upsolveRes.data ?? [];
  const upsolveSolves = upsolveRows
    .filter((u) => u.solved_at !== null)
    .map((u) => ({
      contest_id: u.contest_id,
      problem_index: u.problem_index,
      solved_at: u.solved_at as string,
    }));
  const openUpsolve: OpenUpsolveItem[] = upsolveRows
    .filter((u) => u.solved_at === null)
    .map((u) => ({
      contest_id: u.contest_id,
      problem_index: u.problem_index,
      problem_name: u.problem_name,
      rating: u.rating,
      tags: u.tags ?? [],
    }))
    .sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));

  const practiceDayCounts = buildPracticeDayCounts(
    { trainings: trainingRows, dailySolves, upsolveSolves },
    timezone,
  );
  const streak = computeStreakFromDays(new Set(practiceDayCounts.keys()), tKey);

  const todayBiteDone = dailySolves.some((d) => d.day_key === tKey);
  const todayRoundDone = trainingRows.some(
    (t) => dayKeyInTz(new Date(t.finished_at), timezone) === tKey,
  );

  // Latest practice of any kind (ISO strings from PostgREST compare safely).
  let lastPracticeAt: string | null = trainingRows[0]?.finished_at ?? null;
  for (const d of dailySolves) {
    if (!lastPracticeAt || d.solved_at > lastPracticeAt) lastPracticeAt = d.solved_at;
  }
  for (const u of upsolveSolves) {
    if (!lastPracticeAt || u.solved_at > lastPracticeAt) lastPracticeAt = u.solved_at;
  }
  const daysIdle = lastPracticeAt
    ? Math.max(0, diffDayKeys(tKey, dayKeyInTz(new Date(lastPracticeAt), timezone)))
    : 0;

  const totalAk = trainingRows.filter((t) => t.is_ak).length;
  const totalRounds = trainingRows.length;
  const akRate = totalRounds === 0 ? 0 : Math.round((totalAk / totalRounds) * 100);
  const recentPerf = trainingRows
    .slice(0, 10)
    .reverse()
    .map((t) => t.performance);
  const avgRecentPerf =
    recentPerf.length === 0
      ? 0
      : Math.round(recentPerf.reduce((a, b) => a + b, 0) / recentPerf.length);
  const lastFinishedAt = trainingRows[0]?.finished_at ?? null;

  const prev = lastTrainingsRes.data?.[0] as
    | { training_problems?: PrevProblem[] }
    | undefined;
  const prevUnsolved: PrevProblem[] = (prev?.training_problems ?? []).filter(
    (p) => !p.solved_at,
  );
  const gateCandidates: GateCandidate[] = prevUnsolved
    .map((p) => ({
      contest_id: p.contest_id,
      problem_index: p.problem_index,
      problem_name: p.problem_name,
      rating: p.rating,
    }))
    .sort((a, b) => a.rating - b.rating);

  return {
    userId: user.id,
    profile: {
      cf_handle: profile.cf_handle,
      cf_rating: profile.cf_rating,
      level: profile.level,
    },
    timezone,
    todayKey: tKey,
    trainings: trainingRows,
    streak,
    practiceDayCounts,
    todayBiteDone,
    todayRoundDone,
    openUpsolve,
    lastPracticeAt,
    daysIdle,
    totalRounds,
    totalAk,
    akRate,
    avgRecentPerf,
    recentPerf,
    lastFinishedAt,
    gateCandidates,
    gateBlocked: gateCandidates.length > 0,
    recentHeatmap: buildRecentHeatmap(practiceDayCounts, 30, tKey),
    weakestTag: computeWeakestTag(trainingRows),
  };
});

// Lowest AK-rate tag with at least 3 themed rounds. Mirrors the "Focus next on"
// heuristic in app/tags/page.tsx so the dashboard quick-start picks the same
// tag the user is already being told to drill.
function computeWeakestTag(rows: TrainingRow[]): string | null {
  const buckets = new Map<string, { rounds: number; aks: number }>();
  for (const t of rows) {
    if (!t.tag_filter || t.tag_filter.length === 0) continue;
    for (const tag of t.tag_filter) {
      const b = buckets.get(tag) ?? { rounds: 0, aks: 0 };
      b.rounds += 1;
      if (t.is_ak) b.aks += 1;
      buckets.set(tag, b);
    }
  }
  const eligible = [...buckets.entries()]
    .filter(([, b]) => b.rounds >= 3)
    .map(([tag, b]) => ({ tag, akRate: b.aks / b.rounds }))
    .sort((a, b) => a.akRate - b.akRate);
  return eligible[0]?.tag ?? null;
}
