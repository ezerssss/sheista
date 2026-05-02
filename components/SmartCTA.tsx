"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, ArrowRight, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAllProblems, useSolvedProblems } from "@/hooks/useProblems";
import { getLevel, ratingsOfLevel } from "@/lib/themecp/levels";
import { selectRoundProblems } from "@/lib/themecp/select-problems";
import { pickWeightedRandomTag } from "@/lib/themecp/tags";
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
    // ThemeCP requires a single shared theme per round. Prefer the user's
    // weakest tag (mirrors /tags "Focus next on"); fall back to a weighted
    // random tag for cold-start users with <3 themed rounds anywhere.
    const theme = weakestTag ?? pickWeightedRandomTag().value;
    const slots = selectRoundProblems({
      pool,
      solvedKeys,
      ratings,
      tags: [theme],
      contestRange: null,
    });
    if (slots.length !== 4 || !slots.every((s) => s.problem)) {
      // Couldn't fill all four slots even after the selector's no-tag
      // fallbacks — bounce to /training so the user can pick a different theme.
      router.push("/training");
      return;
    }
    const startTime = Date.now() + 10_000;
    const endTime = startTime + Number(levelObj.time) * 60_000;
    const problems = slots.map((s) => s.problem!) as TrainingProblem[];
    setActiveTraining({ level, startTime, endTime, problems, tagFilter: [theme] });
    router.push("/round");
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
