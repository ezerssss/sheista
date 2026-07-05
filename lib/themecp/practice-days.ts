import { dayKeyInTz } from "@/lib/time/day-key";

/**
 * Practice intensity per day, for the heatmap and the practice streak.
 * The count is "problems practiced that day":
 *   - a finished training round counts 4 (keyed by finished_at)
 *   - an upsolve solve counts 1 (keyed by its CF solve time)
 *   - a daily bite counts 1 — unless the same problem is also a same-day
 *     upsolve solve (the bite IS the upsolve; don't count it twice)
 * The CalendarHeatmap scale (1 light … 4+ deepest) then reads naturally:
 * one bite = light shade, a full round = deepest.
 */
export type PracticeSources = {
  trainings: { finished_at: string }[];
  dailySolves: { day_key: string; contest_id: number; problem_index: string }[];
  upsolveSolves: { contest_id: number; problem_index: string; solved_at: string }[];
};

export function buildPracticeDayCounts(
  { trainings, dailySolves, upsolveSolves }: PracticeSources,
  timeZone: string,
): Map<string, number> {
  const counts = new Map<string, number>();
  const add = (k: string, n: number) => counts.set(k, (counts.get(k) ?? 0) + n);

  const upsolvedOn = new Set<string>();
  for (const u of upsolveSolves) {
    const k = dayKeyInTz(new Date(u.solved_at), timeZone);
    upsolvedOn.add(`${k}|${u.contest_id}_${u.problem_index}`);
    add(k, 1);
  }

  for (const t of trainings) {
    add(dayKeyInTz(new Date(t.finished_at), timeZone), 4);
  }

  for (const d of dailySolves) {
    if (upsolvedOn.has(`${d.day_key}|${d.contest_id}_${d.problem_index}`)) continue;
    add(d.day_key, 1);
  }

  return counts;
}
