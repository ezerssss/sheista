import type { TrainingProblem } from "@/types/themecp";

/**
 * Ported verbatim from C0ldSmi1e/Training-Tracker's utils/getPerformance.ts.
 * The formula mirrors pwned's original ThemeCP spreadsheet (Excel branches).
 *
 *   maxThreshold = max(base, min(max, base + 2.5*(level-52)))
 *     - if last (4th) problem solved: base=120, max=180
 *     - else:                          base=135, max=195
 *
 *   if 4th solved: perf = (t4/T)*R4 + ((T-t4)/T)*(R4+400) + ((level-1) % 4)*12.5
 *   elif 3rd solved: perf = (t3/T)*R3 + ((T-t3)/T)*R4
 *   elif 2nd solved: perf = (t2/T)*R2 + ((T-t2)/T)*R3
 *   elif 1st solved: perf = (t1/T)*R1 + ((T-t1)/T)*R2
 *   else (none):     perf = R1 - 50
 *
 * t_i is in minutes since the round started.
 */
export function computePerformance(args: {
  level: number; // 1..109
  startTime: number; // ms
  problems: TrainingProblem[]; // length 4, ordered by slot 1..4
}): number {
  const { level, startTime, problems } = args;
  const ratings = problems.map((p) => p.rating);
  const solvedTimes = problems.map((p) =>
    p.solvedAt ? (p.solvedAt - startTime) / 60000 : null,
  );

  const getMaxThreshold = (isLastProblem: boolean) => {
    const base = isLastProblem ? 120 : 135;
    const max = isLastProblem ? 180 : 195;
    return Math.max(base, Math.min(max, base + 2.5 * (level - 52)));
  };

  let perf: number;
  if (solvedTimes[3] === null) {
    if (solvedTimes[2] === null) {
      if (solvedTimes[1] === null) {
        if (solvedTimes[0] === null) {
          perf = ratings[0] - 50;
        } else {
          const T = getMaxThreshold(false);
          perf = (solvedTimes[0]! / T) * ratings[0] + ((T - solvedTimes[0]!) / T) * ratings[1];
        }
      } else {
        const T = getMaxThreshold(false);
        perf = (solvedTimes[1]! / T) * ratings[1] + ((T - solvedTimes[1]!) / T) * ratings[2];
      }
    } else {
      const T = getMaxThreshold(false);
      perf = (solvedTimes[2]! / T) * ratings[2] + ((T - solvedTimes[2]!) / T) * ratings[3];
    }
  } else {
    const T = getMaxThreshold(true);
    perf =
      (solvedTimes[3]! / T) * ratings[3] +
      ((T - solvedTimes[3]!) / T) * (ratings[3] + 400) +
      ((level - 1) % 4) * 12.5;
  }
  return Math.round(perf);
}
