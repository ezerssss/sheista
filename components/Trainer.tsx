"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RefreshCw, Play, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagSelector } from "@/components/TagSelector";
import { useAllProblems, useLastTraining, useSolvedProblems } from "@/hooks/useProblems";
import { pickWeightedRandomTag } from "@/lib/themecp/tags";
import { allLevels, getLevel, ratingsOfLevel } from "@/lib/themecp/levels";
import { selectRoundProblems, type SlotResult } from "@/lib/themecp/select-problems";
import {
  type ActiveTraining,
  getActiveTraining,
  newRoundId,
  setActiveTraining,
} from "@/lib/themecp/active-training";
import type { TrainingProblem } from "@/types/themecp";

export function Trainer({ handle, level: initialLevel }: { handle: string; level: number }) {
  const router = useRouter();
  const { problems: pool, isLoading: poolLoading, error: poolErr } = useAllProblems();
  const { solved, refresh: refreshSolved } = useSolvedProblems(handle);
  const { lastTraining, refresh: refreshLast } = useLastTraining();

  const [level, setLevel] = useState(initialLevel);
  const levelObj = useMemo(() => getLevel(level), [level]);
  const ratings = useMemo(() => ratingsOfLevel(levelObj), [levelObj]);

  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [contestRange, setContestRange] = useState<[number, number] | null>(null);
  const [rangeLb, setRangeLb] = useState<string>("");
  const [rangeUb, setRangeUb] = useState<string>("");

  const [slots, setSlots] = useState<SlotResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // If there's already a live round, /training has nothing useful to offer —
  // bounce the user to the round room.
  useEffect(() => {
    if (getActiveTraining()) router.replace("/round");
  }, [router]);

  const solvedKeys = useMemo(
    () => new Set(solved.map((p) => `${p.contestId}_${p.index}`)),
    [solved],
  );

  // Gate: after a non-AK round, force the user to upsolve EVERY unsolved
  // problem from the last round before they can start a new one.
  const gateProblems = useMemo(() => {
    if (!lastTraining) return [];
    return lastTraining.training_problems
      .filter((p) => !p.solved_at)
      .filter((p) => !solvedKeys.has(`${p.contest_id}_${p.problem_index}`))
      .sort((a, b) => a.rating - b.rating);
  }, [lastTraining, solvedKeys]);

  const gateBlocked = gateProblems.length > 0;

  const [checkingGate, setCheckingGate] = useState(false);
  const checkGate = async () => {
    setCheckingGate(true);
    try {
      await Promise.all([
        refreshSolved(),
        refreshLast(),
        fetch("/api/upsolve", { method: "POST" }).catch(() => null),
      ]);
      // The gate POST may have flipped a previous round's unsolved problem to
      // solved server-side — bust the router cache so dashboard/history/etc
      // reflect the new gateCandidate on next navigation.
      router.refresh();
    } finally {
      setCheckingGate(false);
    }
  };

  const onToggleTag = (v: string) =>
    setTagFilter((prev) => (prev.includes(v) ? prev.filter((t) => t !== v) : [...prev, v]));

  const onRandomTag = () => {
    setTagFilter([pickWeightedRandomTag().value]);
  };

  const applyRange = () => {
    const lb = Number(rangeLb);
    const ub = Number(rangeUb);
    if (!lb || !ub || lb > ub) {
      setContestRange(null);
      return;
    }
    setContestRange([lb, ub]);
  };

  const generate = () => {
    setError(null);
    if (poolLoading) return;
    const results = selectRoundProblems({
      pool,
      solvedKeys,
      ratings,
      tags: tagFilter,
      contestRange,
    });
    setSlots(results);
  };

  const start = () => {
    const ok = slots.length === 4 && slots.every((s) => s.problem !== null);
    if (!ok) {
      setError("Some slots have no unsolved match. Loosen filters or change tags.");
      return;
    }
    const startTime = Date.now() + 10_000;
    const endTime = startTime + Number(levelObj.time) * 60_000;
    const problems = slots.map((s) => s.problem!) as TrainingProblem[];
    const training: ActiveTraining = {
      id: newRoundId(),
      level,
      startTime,
      endTime,
      problems,
      tagFilter,
    };
    setActiveTraining(training);
    router.push("/round");
  };

  if (poolErr) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Couldn&apos;t load Codeforces problems: {poolErr.message}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="label-eyebrow">Custom round</p>
        <h1 className="text-3xl font-semibold tracking-tight">Configure a round</h1>
        <p className="text-sm text-muted-foreground">
          Pick a level, an optional theme, and a contest-id range — then generate four unsolved
          problems. Start moves you into the round room.
        </p>
      </header>

      {gateBlocked && (
        <section className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
                <p className="label-eyebrow">
                  Upsolve required — {gateProblems.length} problem
                  {gateProblems.length === 1 ? "" : "s"} left
                </p>
              </div>
              <p className="text-sm">
                Solve every problem you missed last round before starting a new one.
              </p>
              <ul className="space-y-1">
                {gateProblems.map((p) => (
                  <li key={`${p.contest_id}_${p.problem_index}`}>
                    <Link
                      href={`https://codeforces.com/contest/${p.contest_id}/problem/${p.problem_index}`}
                      target="_blank"
                      className="inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
                    >
                      <span className="font-mono text-xs text-muted-foreground">
                        {p.rating}
                      </span>
                      <span className="font-mono text-muted-foreground">
                        {p.contest_id}
                        {p.problem_index}
                      </span>{" "}
                      {p.problem_name || "Problem"}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <Button variant="outline" size="sm" onClick={checkGate} disabled={checkingGate}>
              <RefreshCw className="h-3.5 w-3.5" />
              {checkingGate ? "Checking…" : "I solved them"}
            </Button>
          </div>
        </section>
      )}

      <section className="space-y-6 rounded-lg border border-border p-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Level</Label>
            <select
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 font-mono text-sm transition-colors focus-visible:border-foreground/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {allLevels().map((l) => (
                <option key={l.id} value={Number(l.level)}>
                  {l.level} — {l.P1}/{l.P2}/{l.P3}/{l.P4} ({l.time}m)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Contest ID range <span className="text-muted-foreground/70">(optional)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="from"
                value={rangeLb}
                onChange={(e) => setRangeLb(e.target.value)}
                className="font-mono"
              />
              <Input
                placeholder="to"
                value={rangeUb}
                onChange={(e) => setRangeUb(e.target.value)}
                className="font-mono"
              />
              <Button variant="outline" size="default" onClick={applyRange}>
                Apply
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {contestRange ? (
                <>
                  active{" "}
                  <span className="font-mono text-foreground">
                    {contestRange[0]}–{contestRange[1]}
                  </span>
                </>
              ) : (
                "all contests"
              )}
            </p>
          </div>
        </div>

        <hr className="border-border" />

        <div className="space-y-2">
          <p className="label-eyebrow">Slots</p>
          <div className="grid grid-cols-4 gap-2">
            {ratings.map((r, i) => (
              <div
                key={i}
                className="rounded-md border border-border px-2 py-1.5 text-center"
              >
                <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
                  p{i + 1}
                </div>
                <div className="font-mono text-sm tabular-nums">{r}</div>
              </div>
            ))}
          </div>
        </div>

        <hr className="border-border" />

        <TagSelector
          selected={tagFilter}
          onToggle={onToggleTag}
          onClear={() => setTagFilter([])}
          onRandom={onRandomTag}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold tracking-tight">
            {slots.length === 0 ? "Round" : "Generated round"}
          </h2>
        </div>

        {slots.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Pick your filters then hit Generate. The selector will only suggest problems you
              haven&apos;t already solved on Codeforces.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            {slots.map((s, i) => {
              const problem = s.problem;
              const fallback = s.fallback;
              const rating = problem?.rating ?? ratings[i];
              return (
                <div
                  key={i}
                  className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}
                >
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border font-mono text-[10px] text-muted-foreground">
                        {i + 1}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">{rating}</span>
                      {problem ? (
                        <Link
                          href={problem.url}
                          target="_blank"
                          className="text-sm font-medium underline-offset-4 hover:underline"
                        >
                          <span className="font-mono text-muted-foreground">
                            {problem.contestId}
                            {problem.index}
                          </span>{" "}
                          {problem.name}
                        </Link>
                      ) : (
                        <span className="text-sm italic text-muted-foreground">
                          no unsolved problem found
                        </span>
                      )}
                    </div>
                    {problem && (
                      <div className="flex flex-wrap gap-1 pl-9 text-[11px] text-muted-foreground">
                        {problem.tags.map((t) => (
                          <span key={t}>#{t}</span>
                        ))}
                      </div>
                    )}
                    {fallback && fallback !== "ok" && fallback !== "empty" && problem && (
                      <p className="flex items-center gap-1.5 pl-9 text-[11px] text-muted-foreground">
                        <AlertCircle className="h-3 w-3" />
                        {fallback === "no-range" && "no in-range match — picked outside the contest range"}
                        {fallback === "no-tag" && "no tag match — picked an untagged problem at this rating"}
                      </p>
                    )}
                    {fallback === "empty" && (
                      <p className="flex items-center gap-1.5 pl-9 text-[11px] text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        no unsolved problem at rating {rating}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={generate} disabled={poolLoading || gateBlocked}>
            <RefreshCw className="h-3.5 w-3.5" />
            {slots.length === 0 ? "Generate" : "Regenerate"}
          </Button>
          {slots.length > 0 && slots.every((s) => s.problem) && !gateBlocked && (
            <Button onClick={start} variant="default" data-pet-perch="primary">
              <Play className="h-3.5 w-3.5" />
              Start round
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
