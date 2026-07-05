import type { CodeforcesProblem, TrainingProblem } from "@/types/themecp";

type Args = {
  pool: CodeforcesProblem[]; // already filtered (contestId >= 700, exclusions)
  solvedKeys: Set<string>; // "contestId_index"
  ratings: [number, number, number, number];
  tags: string[]; // empty = no theme filter
  contestRange?: [number, number] | null; // freshness window; null = no filter
  // When true, never drop the tag filter as a fallback. Slots without a
  // tag-matched unsolved problem return fallback="empty" instead of an
  // off-theme pick. Used by the dashboard quick-start, which guarantees a
  // round shares a single theme — see callers for the retry-with-different
  // -theme strategy when this returns empty slots.
  strictTags?: boolean;
};

export type SlotResult = {
  slot: 1 | 2 | 3 | 4;
  rating: number;
  problem: TrainingProblem | null;
  /**
   * "ok"          - found a problem with all filters
   * "no-range"    - dropped the contestId range filter
   * "no-tag"      - dropped the tag filter (slot has no theme)
   * "empty"       - no unsolved problem at this rating, even after dropping filters
   */
  fallback: "ok" | "no-range" | "no-tag" | "empty";
};

const key = (p: CodeforcesProblem) => `${p.contestId}_${p.index}`;

const toTrainingProblem = (p: CodeforcesProblem, slot: 1 | 2 | 3 | 4): TrainingProblem => ({
  contestId: p.contestId,
  index: p.index,
  name: p.name,
  rating: p.rating ?? 0,
  tags: p.tags,
  url: `https://codeforces.com/contest/${p.contestId}/problem/${p.index}`,
  solvedAt: null,
  slot,
});

function pickRandomNew(pool: CodeforcesProblem[], chosen: Set<string>): CodeforcesProblem | null {
  if (pool.length === 0) return null;
  // Try up to 50 random picks; if all collide, scan linearly.
  for (let i = 0; i < 50; i++) {
    const cand = pool[Math.floor(Math.random() * pool.length)];
    if (!chosen.has(key(cand))) return cand;
  }
  for (const cand of pool) if (!chosen.has(key(cand))) return cand;
  return null;
}

export type DailySource = "upsolve" | "weak-tag" | "random";

export type DailyPick = {
  problem: TrainingProblem;
  source: DailySource;
};

type UpsolveLike = {
  contest_id: number;
  problem_index: string;
  problem_name: string;
  rating: number | null;
  tags: string[];
};

/**
 * Pick the single problem for a daily bite (~15 minutes).
 *
 * Priority:
 *   (a) easiest unsolved item in the upsolve queue — light days quietly clear
 *       the gate (queue items already solved on CF are skipped)
 *   (b) weakest tag near targetRating: exact → ±100 → ±200
 *   (c) anything unsolved near targetRating: exact → ±200
 * Returns null when the pool has nothing usable (caller sends the user to
 * /training to build a round manually).
 */
export function selectDailyProblem({
  pool,
  solvedKeys,
  targetRating,
  weakestTag,
  openUpsolve,
}: {
  pool: CodeforcesProblem[];
  solvedKeys: Set<string>;
  targetRating: number;
  weakestTag: string | null;
  openUpsolve: UpsolveLike[];
}): DailyPick | null {
  const open = openUpsolve
    .filter((u) => !solvedKeys.has(`${u.contest_id}_${u.problem_index}`))
    .sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
  if (open.length > 0) {
    const u = open[0];
    return {
      source: "upsolve",
      problem: {
        contestId: u.contest_id,
        index: u.problem_index,
        name: u.problem_name,
        rating: u.rating ?? 0,
        tags: u.tags,
        url: `https://codeforces.com/contest/${u.contest_id}/problem/${u.problem_index}`,
        solvedAt: null,
        slot: 1,
      },
    };
  }

  const unsolved = pool.filter((p) => !solvedKeys.has(key(p)));
  const none = new Set<string>();

  if (weakestTag) {
    const tagged = unsolved.filter((p) => p.tags.includes(weakestTag));
    for (const spread of [0, 100, 200]) {
      const cand = pickRandomNew(
        tagged.filter((p) => Math.abs((p.rating ?? 0) - targetRating) <= spread),
        none,
      );
      if (cand) return { source: "weak-tag", problem: toTrainingProblem(cand, 1) };
    }
  }

  for (const spread of [0, 200]) {
    const cand = pickRandomNew(
      unsolved.filter((p) => Math.abs((p.rating ?? 0) - targetRating) <= spread),
      none,
    );
    if (cand) return { source: "random", problem: toTrainingProblem(cand, 1) };
  }

  return null;
}

/**
 * ThemeCP-faithful round selector.
 *
 * HARD RULE: only unsolved problems are eligible. We never fall back to solved.
 *
 * Per slot, escalation order:
 *   1. tag-matched ∩ in-range
 *   2. tag-matched ∩ out-of-range  -> fallback="no-range"
 *   3. (drop tag) any unsolved ∩ in-range  -> fallback="no-tag"
 *   4. (drop tag) any unsolved ∩ out-of-range -> fallback="no-tag"
 *   5. nothing left -> fallback="empty", problem=null
 */
export function selectRoundProblems(args: Args): SlotResult[] {
  const { pool, solvedKeys, ratings, tags, contestRange, strictTags } = args;
  const tagSet = new Set(tags);

  const inRange = (p: CodeforcesProblem) =>
    !contestRange || (p.contestId >= contestRange[0] && p.contestId <= contestRange[1]);

  const chosen = new Set<string>();
  const results: SlotResult[] = [];

  for (let i = 0; i < 4; i++) {
    const slot = (i + 1) as 1 | 2 | 3 | 4;
    const r = ratings[i];

    // Step 1: same rating, unsolved (HARD).
    const unsolved = pool.filter((p) => p.rating === r && !solvedKeys.has(key(p)));

    // Step 2: tag-match if user picked tags.
    const tagMatched = tags.length === 0 ? unsolved : unsolved.filter((p) => p.tags.some((t) => tagSet.has(t)));

    const buckets: { problems: CodeforcesProblem[]; fallback: SlotResult["fallback"] }[] = [
      { problems: tagMatched.filter(inRange), fallback: "ok" },
      { problems: tagMatched.filter((p) => !inRange(p)), fallback: "no-range" },
    ];
    if (tags.length > 0 && !strictTags) {
      // Drop the tag filter (theme escapes for this slot, but problem stays unsolved).
      buckets.push({ problems: unsolved.filter(inRange), fallback: "no-tag" });
      buckets.push({ problems: unsolved.filter((p) => !inRange(p)), fallback: "no-tag" });
    }

    let result: SlotResult = { slot, rating: r, problem: null, fallback: "empty" };
    for (const b of buckets) {
      const cand = pickRandomNew(b.problems, chosen);
      if (cand) {
        chosen.add(key(cand));
        result = { slot, rating: r, problem: toTrainingProblem(cand, slot), fallback: b.fallback };
        break;
      }
    }
    results.push(result);
  }

  return results;
}
