import { createClient } from "@/lib/supabase/server";
import { computeStreak, type StreakResult } from "@/lib/themecp/streak";

export type GateCandidate = {
  contest_id: number;
  problem_index: string;
  problem_name: string;
  rating: number;
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
  trainings: TrainingRow[];
  streak: StreakResult;
  totalRounds: number;
  totalAk: number;
  akRate: number;
  avgRecentPerf: number;
  recentPerf: number[];
  lastFinishedAt: string | null;
  gateCandidate: GateCandidate | null;
  gateBlocked: boolean;
  recentHeatmap: { date: string; count: number }[];
  // Lowest-AK-rate tag with at least 3 themed rounds. Null when the user has
  // not yet built up enough history for the heuristic — caller should fall
  // back to a weighted random tag.
  weakestTag: string | null;
};

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildRecentHeatmap(
  trainings: TrainingRow[],
  days: number,
): { date: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const t of trainings) {
    const k = dayKey(new Date(t.finished_at));
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const today = new Date();
  const out: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const k = dayKey(d);
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

export async function getUserStats(): Promise<UserStats | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("cf_handle, cf_rating, level")
    .eq("id", user.id)
    .single();

  if (!profile?.cf_handle) return null;

  const { data: trainings } = await supabase
    .from("trainings")
    .select("started_at, finished_at, performance, is_ak, level_at_start, level_at_end, tag_filter")
    .eq("user_id", user.id)
    .order("finished_at", { ascending: false })
    .limit(365);

  const trainingRows: TrainingRow[] = trainings ?? [];
  const finishedAtList = trainingRows.map((t) => t.finished_at);
  const streak = computeStreak(finishedAtList);

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

  const { data: lastTrainings } = await supabase
    .from("trainings")
    .select(
      "training_problems(contest_id, problem_index, problem_name, rating, solved_at)",
    )
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(1);

  const prev = lastTrainings?.[0] as
    | { training_problems?: PrevProblem[] }
    | undefined;
  const prevUnsolved: PrevProblem[] = (prev?.training_problems ?? []).filter(
    (p) => !p.solved_at,
  );
  const gateCandidate: GateCandidate | null =
    prevUnsolved.length === 0
      ? null
      : prevUnsolved.reduce(
          (min, p) => (p.rating < min.rating ? p : min),
          prevUnsolved[0],
        );

  return {
    userId: user.id,
    profile: {
      cf_handle: profile.cf_handle,
      cf_rating: profile.cf_rating,
      level: profile.level,
    },
    trainings: trainingRows,
    streak,
    totalRounds,
    totalAk,
    akRate,
    avgRecentPerf,
    recentPerf,
    lastFinishedAt,
    gateCandidate,
    gateBlocked: gateCandidate !== null,
    recentHeatmap: buildRecentHeatmap(trainingRows, 30),
    weakestTag: computeWeakestTag(trainingRows),
  };
}

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
