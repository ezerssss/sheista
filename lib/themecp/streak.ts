/**
 * A "practice day" is any day the user did at least one real problem — a
 * daily bite, an upsolve, or a full training round.
 *
 * Days are bucketed by YYYY-MM-DD in the user's timezone (profiles.timezone)
 * via lib/time/day-key — never by the runtime's local clock.
 *
 * Current streak: consecutive days ending today; if today has no practice but
 *                 yesterday does, current streak counts up to yesterday.
 *                 If neither today nor yesterday has practice, current = 0.
 *
 * Longest streak: maximum length of any consecutive-day run in history.
 */

import { dayKeyInTz, shiftDayKey, todayKey } from "@/lib/time/day-key";

export type StreakResult = {
  current: number;
  longest: number;
  todayDone: boolean;
  trainingDays: Set<string>;
};

/** Pure core: streak math over a set of day keys. Timezone-agnostic. */
export function computeStreakFromDays(days: Set<string>, today: string): StreakResult {
  // Longest run.
  const sorted = [...days].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const k of sorted) {
    run = prev && shiftDayKey(prev, 1) === k ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = k;
  }

  // Current streak.
  const todayDone = days.has(today);
  let cursor: string;
  if (todayDone) cursor = today;
  else if (days.has(shiftDayKey(today, -1))) cursor = shiftDayKey(today, -1);
  else return { current: 0, longest, todayDone, trainingDays: days };

  let current = 0;
  while (days.has(cursor)) {
    current += 1;
    cursor = shiftDayKey(cursor, -1);
  }

  return { current, longest, todayDone, trainingDays: days };
}

export function computeStreak(
  timestamps: (string | number | Date)[],
  timeZone: string,
  now: Date = new Date(),
): StreakResult {
  const days = new Set<string>();
  for (const t of timestamps) days.add(dayKeyInTz(new Date(t), timeZone));
  return computeStreakFromDays(days, todayKey(timeZone, now));
}
