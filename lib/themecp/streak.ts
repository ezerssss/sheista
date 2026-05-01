/**
 * A "training day" is any day the user finished a training (regardless of AK).
 * Days are bucketed by user-local YYYY-MM-DD.
 *
 * Current streak: consecutive days ending today; if today has no training but
 *                 yesterday does, current streak counts up to yesterday.
 *                 If neither today nor yesterday has training, current streak = 0.
 *
 * Longest streak: maximum length of any consecutive-day run in history.
 */

const dayKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const addDays = (d: Date, n: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
};

export type StreakResult = {
  current: number;
  longest: number;
  todayDone: boolean;
  trainingDays: Set<string>;
};

export function computeStreak(finishedAtList: (string | number | Date)[], now: Date = new Date()): StreakResult {
  const days = new Set<string>();
  for (const t of finishedAtList) days.add(dayKey(new Date(t)));

  // Longest run.
  const sorted = [...days].sort();
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of sorted) {
    const d = new Date(`${k}T00:00:00`);
    if (prev && dayKey(addDays(prev, 1)) === k) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = d;
  }

  // Current streak.
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const todayKey = dayKey(today);
  const yesterdayKey = dayKey(addDays(today, -1));

  const todayDone = days.has(todayKey);
  let cursor: Date;
  if (todayDone) cursor = today;
  else if (days.has(yesterdayKey)) cursor = addDays(today, -1);
  else return { current: 0, longest, todayDone, trainingDays: days };

  let current = 0;
  while (days.has(dayKey(cursor))) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  return { current, longest, todayDone, trainingDays: days };
}
