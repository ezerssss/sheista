"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, ArrowRight, AlertTriangle, RefreshCw, Timer, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllProblems, useSolvedProblems } from "@/hooks/useProblems";
import { getLevel, ratingsOfLevel } from "@/lib/themecp/levels";
import { selectDailyProblem, selectRoundProblems } from "@/lib/themecp/select-problems";
import { allTags } from "@/lib/themecp/tags";
import {
  type ActiveDaily,
  type ActiveTraining,
  getActiveDaily,
  getActiveTraining,
  newRoundId,
  setActiveDaily,
  setActiveTraining,
} from "@/lib/themecp/active-training";
import type { TrainingProblem } from "@/types/themecp";

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

const BITE_MINUTES = 15;

export function SmartCTA({
  handle,
  level,
  gateCandidates,
  todayRoundDone,
  todayBiteDone,
  daysIdle,
  openUpsolve,
  weakestTag,
}: {
  handle: string;
  level: number;
  gateCandidates: GateCandidate[];
  todayRoundDone: boolean;
  todayBiteDone: boolean;
  daysIdle: number;
  openUpsolve: OpenUpsolveItem[];
  weakestTag: string | null;
}) {
  const router = useRouter();
  const { problems: pool, isLoading: poolLoading } = useAllProblems();
  const { solved, refresh: refreshSolved } = useSolvedProblems(handle);

  const [active, setActive] = useState<ActiveTraining | null>(null);
  const [activeDaily, setActiveDailyState] = useState<ActiveDaily | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [starting, setStarting] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkGate = async () => {
    setChecking(true);
    try {
      // Re-pull CF solved set + sync upsolve table; router.refresh re-runs the
      // dashboard's server query so gateCandidates also updates if needed.
      await Promise.all([
        refreshSolved(),
        fetch("/api/upsolve", { method: "POST" }).catch(() => null),
      ]);
      router.refresh();
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    setActive(getActiveTraining());
    setActiveDailyState(getActiveDaily());
    setHydrated(true);
  }, []);

  const solvedKeys = useMemo(
    () => new Set(solved.map((p) => `${p.contestId}_${p.index}`)),
    [solved],
  );

  const unsolvedGate = useMemo(
    () =>
      gateCandidates.filter(
        (g) => !solvedKeys.has(`${g.contest_id}_${g.problem_index}`),
      ),
    [gateCandidates, solvedKeys],
  );
  const gateBlocked = unsolvedGate.length > 0;

  // Start a ~15-minute one-problem bite. `items` overrides the upsolve source
  // (the gate flow passes the gate problems so the bite clears the gate).
  const startBite = (items?: OpenUpsolveItem[]) => {
    if (poolLoading || pool.length === 0) return;
    const ratings = ratingsOfLevel(getLevel(level));
    const pick = selectDailyProblem({
      pool,
      solvedKeys,
      targetRating: ratings[1],
      weakestTag,
      openUpsolve: items ?? openUpsolve,
    });
    if (!pick) {
      router.push("/training");
      return;
    }
    const startTime = Date.now();
    setActiveDaily({
      id: newRoundId(),
      problem: pick.problem,
      source: pick.source,
      startTime,
      softEndTime: startTime + BITE_MINUTES * 60_000,
    });
    router.push("/daily");
  };

  const quickStart = () => {
    if (poolLoading || pool.length === 0) return;
    setStarting(true);
    const levelObj = getLevel(level);
    const ratings = ratingsOfLevel(levelObj);

    // Same-theme is non-negotiable. Build candidate themes: weakestTag (the
    // /tags "Focus next on" pick) first, then every other tag in shuffled
    // order. We never produce a round with mixed tags.
    const seen = new Set<string>();
    const candidates: string[] = [];
    if (weakestTag) {
      candidates.push(weakestTag);
      seen.add(weakestTag);
    }
    const shuffled = allTags()
      .map((t) => t.value)
      .sort(() => Math.random() - 0.5);
    for (const t of shuffled) {
      if (!seen.has(t)) {
        candidates.push(t);
        seen.add(t);
      }
    }

    const launch = (theme: string, problems: TrainingProblem[]) => {
      const startTime = Date.now() + 10_000;
      const endTime = startTime + Number(levelObj.time) * 60_000;
      setActiveTraining({
        id: newRoundId(),
        level,
        startTime,
        endTime,
        problems,
        tagFilter: [theme],
      });
      router.push("/round");
    };

    // Pass 1 — strict: same theme + exact rating per slot. First candidate
    // to fill 4 slots cleanly wins (weakestTag has priority).
    for (const theme of candidates) {
      const slots = selectRoundProblems({
        pool,
        solvedKeys,
        ratings,
        tags: [theme],
        contestRange: null,
        strictTags: true,
      });
      if (slots.length === 4 && slots.every((s) => s.problem !== null)) {
        launch(theme, slots.map((s) => s.problem!) as TrainingProblem[]);
        return;
      }
    }

    // Pass 2 — same-theme, rating-flex: when the user has tapped out the
    // exact-rating bucket for every theme, keep the theme strict but let
    // each slot grab the closest-rated unsolved tag-matched problem. Among
    // themes that can produce 4 distinct picks, take the one whose total
    // rating deviation from the level's targets is smallest.
    let best: { theme: string; problems: TrainingProblem[]; deviation: number } | null = null;
    for (const theme of candidates) {
      const tagMatched = pool.filter(
        (p) => p.tags.includes(theme) && !solvedKeys.has(`${p.contestId}_${p.index}`),
      );
      if (tagMatched.length < 4) continue;

      const used = new Set<string>();
      const problems: TrainingProblem[] = [];
      let deviation = 0;
      for (let i = 0; i < 4; i++) {
        const target = ratings[i];
        let pick: (typeof tagMatched)[number] | null = null;
        let pickDist = Infinity;
        for (const p of tagMatched) {
          const id = `${p.contestId}_${p.index}`;
          if (used.has(id)) continue;
          const dist = Math.abs((p.rating ?? 0) - target);
          if (dist < pickDist) {
            pickDist = dist;
            pick = p;
          }
        }
        if (!pick) break;
        used.add(`${pick.contestId}_${pick.index}`);
        deviation += pickDist;
        problems.push({
          contestId: pick.contestId,
          index: pick.index,
          name: pick.name,
          rating: pick.rating ?? 0,
          tags: pick.tags,
          url: `https://codeforces.com/contest/${pick.contestId}/problem/${pick.index}`,
          solvedAt: null,
          slot: (i + 1) as 1 | 2 | 3 | 4,
        });
      }
      if (problems.length === 4 && (!best || deviation < best.deviation)) {
        best = { theme, problems, deviation };
      }
    }

    if (best) {
      launch(best.theme, best.problems);
      return;
    }

    // True edge case: no single tag has 4 unsolved problems on CF for this
    // user, period. Bounce to /training so they can drop a level or accept
    // mixed tags manually — there's no honest single-theme round to make.
    router.push("/training");
  };

  // Pre-hydration: render the static "today done"/"start" label so SSR and
  // first paint match. We refine once we know whether there's an active round.
  if (!hydrated) {
    return (
      <Button asChild size="lg" data-pet-perch="primary">
        <Link href="/training">
          {todayRoundDone ? "Do another round" : "Start today's round"}
        </Link>
      </Button>
    );
  }

  if (active) {
    return (
      <Button asChild size="lg" data-pet-perch="primary">
        <Link href="/round">
          <ArrowRight className="h-4 w-4" />
          Resume round
        </Link>
      </Button>
    );
  }

  if (activeDaily) {
    return (
      <Button asChild size="lg" data-pet-perch="primary">
        <Link href="/daily">
          <ArrowRight className="h-4 w-4" />
          Resume daily bite
        </Link>
      </Button>
    );
  }

  if (gateBlocked) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4" />
          <span className="label-eyebrow">
            Upsolve {unsolvedGate.length} problem{unsolvedGate.length === 1 ? "" : "s"} to unlock
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {unsolvedGate.map((g) => (
            <Button
              key={`${g.contest_id}_${g.problem_index}`}
              asChild
              size="sm"
              variant="outline"
              className="border-amber-500/60 text-amber-700 dark:text-amber-300"
            >
              <Link
                href={`https://codeforces.com/contest/${g.contest_id}/problem/${g.problem_index}`}
                target="_blank"
              >
                <span className="font-mono text-[10px] text-muted-foreground">
                  {g.rating}
                </span>
                <span className="font-mono">
                  {g.contest_id}
                  {g.problem_index}
                </span>
              </Link>
            </Button>
          ))}
          <Button onClick={checkGate} disabled={checking} variant="ghost" size="sm">
            <RefreshCw className="h-3.5 w-3.5" />
            {checking ? "Checking…" : "I solved them"}
          </Button>
        </div>
        {!todayBiteDone && (
          <div>
            <Button
              onClick={() =>
                startBite(
                  unsolvedGate.map((g) => ({
                    contest_id: g.contest_id,
                    problem_index: g.problem_index,
                    problem_name: g.problem_name,
                    rating: g.rating,
                    tags: [],
                  })),
                )
              }
              disabled={poolLoading}
              variant="outline"
              size="sm"
            >
              <Timer className="h-3.5 w-3.5" />
              clear one now — {BITE_MINUTES}-min bite
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Comeback: after a few idle days the ask shrinks to one problem —
  // the full round is still one click away, just not the headline.
  if (daysIdle >= 3 && !todayBiteDone) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {poolLoading ? (
          <Skeleton className="h-11 w-[220px] rounded-md" />
        ) : (
          <Button onClick={() => startBite()} size="lg" data-pet-perch="primary">
            <Timer className="h-4 w-4" />
            ease back in — one problem
          </Button>
        )}
        <Button
          onClick={quickStart}
          disabled={poolLoading || starting}
          variant="ghost"
          size="lg"
        >
          full round
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {poolLoading ? (
        // Problem pool still streaming in from Codeforces — show a skeleton
        // instead of a dead-looking disabled button.
        <Skeleton className="h-11 w-[190px] rounded-md" />
      ) : (
        <Button
          onClick={quickStart}
          disabled={starting}
          size="lg"
          data-pet-perch="primary"
        >
          <Play className="h-4 w-4" />
          {todayRoundDone ? "Do another round" : "Start today's round"}
        </Button>
      )}
      {todayBiteDone ? (
        <span className="inline-flex items-center gap-1.5 px-2 text-xs text-accent">
          <Check className="h-3.5 w-3.5" />
          bite done
        </span>
      ) : (
        !poolLoading && (
          <Button onClick={() => startBite()} variant="outline" size="lg">
            <Timer className="h-4 w-4" />
            {BITE_MINUTES}-min bite
          </Button>
        )
      )}
      <Button asChild variant="ghost" size="lg">
        <Link href="/training">Customize</Link>
      </Button>
    </div>
  );
}
