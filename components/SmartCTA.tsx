"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, ArrowRight, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAllProblems, useSolvedProblems } from "@/hooks/useProblems";
import { getLevel, ratingsOfLevel } from "@/lib/themecp/levels";
import { selectRoundProblems } from "@/lib/themecp/select-problems";
import { allTags } from "@/lib/themecp/tags";
import {
  type ActiveTraining,
  getActiveTraining,
  setActiveTraining,
} from "@/lib/themecp/active-training";
import type { TrainingProblem } from "@/types/themecp";

export type GateCandidate = {
  contest_id: number;
  problem_index: string;
  problem_name: string;
  rating: number;
};

export function SmartCTA({
  handle,
  level,
  gateCandidate,
  todayDone,
  weakestTag,
}: {
  handle: string;
  level: number;
  gateCandidate: GateCandidate | null;
  todayDone: boolean;
  weakestTag: string | null;
}) {
  const router = useRouter();
  const { problems: pool, isLoading: poolLoading } = useAllProblems();
  const { solved, refresh: refreshSolved } = useSolvedProblems(handle);

  const [active, setActive] = useState<ActiveTraining | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [starting, setStarting] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkGate = async () => {
    setChecking(true);
    try {
      // Re-pull CF solved set + sync upsolve table; router.refresh re-runs the
      // dashboard's server query so gateCandidate also updates if needed.
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
    setHydrated(true);
  }, []);

  const solvedKeys = useMemo(
    () => new Set(solved.map((p) => `${p.contestId}_${p.index}`)),
    [solved],
  );

  const gateBlocked = useMemo(() => {
    if (!gateCandidate) return false;
    return !solvedKeys.has(`${gateCandidate.contest_id}_${gateCandidate.problem_index}`);
  }, [gateCandidate, solvedKeys]);

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
        <Link href="/training">{todayDone ? "Do another round" : "Start today's round"}</Link>
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

  if (gateBlocked && gateCandidate) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="lg" variant="outline" className="border-amber-500/60 text-amber-700 dark:text-amber-300">
          <Link
            href={`https://codeforces.com/contest/${gateCandidate.contest_id}/problem/${gateCandidate.problem_index}`}
            target="_blank"
          >
            <AlertTriangle className="h-4 w-4" />
            Upsolve {gateCandidate.contest_id}
            {gateCandidate.problem_index}
          </Link>
        </Button>
        <Button onClick={checkGate} disabled={checking} variant="ghost" size="lg">
          <RefreshCw className="h-4 w-4" />
          {checking ? "Checking…" : "I solved it"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        onClick={quickStart}
        disabled={poolLoading || starting}
        size="lg"
        data-pet-perch="primary"
      >
        <Play className="h-4 w-4" />
        {todayDone ? "Do another round" : "Start today's round"}
      </Button>
      <Button asChild variant="ghost" size="lg">
        <Link href="/training">Customize</Link>
      </Button>
    </div>
  );
}
