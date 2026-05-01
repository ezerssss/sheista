"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RefreshCw, Play, Square, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagSelector } from "@/components/TagSelector";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useAllProblems, useSolvedProblems } from "@/hooks/useProblems";
import { allTags } from "@/lib/themecp/tags";
import { allLevels, getLevel, ratingsOfLevel } from "@/lib/themecp/levels";
import { selectRoundProblems, type SlotResult } from "@/lib/themecp/select-problems";
import { computePerformance } from "@/lib/themecp/performance";
import type { TrainingProblem, CodeforcesSubmission } from "@/types/themecp";

const TRAINING_KEY = "sheista:active-training";

type ActiveTraining = {
  level: number;
  startTime: number; // ms (after countdown)
  endTime: number;
  problems: TrainingProblem[];
  tagFilter: string[];
};

export function Trainer({ handle, level: initialLevel }: { handle: string; level: number }) {
  const router = useRouter();
  const { problems: pool, isLoading: poolLoading, error: poolErr } = useAllProblems();
  const { solved, refresh: refreshSolved } = useSolvedProblems(handle);

  // Editable level (defaults to user's current).
  const [level, setLevel] = useState(initialLevel);
  const levelObj = useMemo(() => getLevel(level), [level]);
  const ratings = useMemo(() => ratingsOfLevel(levelObj), [levelObj]);

  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [contestRange, setContestRange] = useState<[number, number] | null>(null);
  const [rangeLb, setRangeLb] = useState<string>("");
  const [rangeUb, setRangeUb] = useState<string>("");

  const [slots, setSlots] = useState<SlotResult[]>([]);
  const [training, setTraining] = useState<ActiveTraining | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore in-progress training from localStorage.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TRAINING_KEY);
      if (stored) {
        const t = JSON.parse(stored) as ActiveTraining;
        if (t.endTime > Date.now()) setTraining(t);
        else localStorage.removeItem(TRAINING_KEY);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (training) localStorage.setItem(TRAINING_KEY, JSON.stringify(training));
  }, [training]);

  const solvedKeys = useMemo(
    () => new Set(solved.map((p) => `${p.contestId}_${p.index}`)),
    [solved],
  );

  const onToggleTag = (v: string) =>
    setTagFilter((prev) => (prev.includes(v) ? prev.filter((t) => t !== v) : [...prev, v]));

  const onRandomTag = () => {
    const tags = allTags();
    const t = tags[Math.floor(Math.random() * tags.length)].value;
    setTagFilter([t]);
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
    const startTime = Date.now() + 10_000; // 10s warmup
    const endTime = startTime + Number(levelObj.time) * 60_000;
    const problems = slots.map((s) => s.problem!) as TrainingProblem[];
    setTraining({ level, startTime, endTime, problems, tagFilter });
  };

  // ---- Auto-detect AK polling ----
  const pollRef = useRef<number | null>(null);
  useEffect(() => {
    if (!training) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    const tick = async () => {
      try {
        const res = await fetch(`/api/cf/submissions/${encodeURIComponent(handle)}?count=50`);
        const json = await res.json();
        if (!json.ok) return;
        const subs = json.submissions as CodeforcesSubmission[];
        setTraining((prev) => {
          if (!prev) return prev;
          const updatedProblems = prev.problems.map((p) => {
            if (p.solvedAt) return p;
            const okSub = subs.find(
              (s) =>
                s.verdict === "OK" &&
                s.problem.contestId === p.contestId &&
                s.problem.index === p.index &&
                s.creationTimeSeconds * 1000 >= prev.startTime,
            );
            return okSub ? { ...p, solvedAt: okSub.creationTimeSeconds * 1000 } : p;
          });
          return { ...prev, problems: updatedProblems };
        });
      } catch {
        // network blip — ignore, next tick will retry.
      }
    };
    void tick();
    pollRef.current = window.setInterval(tick, 30_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [training, handle]);

  // Auto-finish when all 4 solved.
  useEffect(() => {
    if (!training) return;
    const all = training.problems.every((p) => p.solvedAt !== null);
    if (all) void finish(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [training?.problems]);

  const refreshSubmissions = async () => {
    if (!training) return;
    const res = await fetch(`/api/cf/submissions/${encodeURIComponent(handle)}?count=50`);
    const json = await res.json();
    if (!json.ok) return;
    const subs = json.submissions as CodeforcesSubmission[];
    setTraining((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        problems: prev.problems.map((p) => {
          if (p.solvedAt) return p;
          const okSub = subs.find(
            (s) =>
              s.verdict === "OK" &&
              s.problem.contestId === p.contestId &&
              s.problem.index === p.index &&
              s.creationTimeSeconds * 1000 >= prev.startTime,
          );
          return okSub ? { ...p, solvedAt: okSub.creationTimeSeconds * 1000 } : p;
        }),
      };
    });
  };

  const finish = async (autoAk: boolean) => {
    if (!training || finishing) return;
    setFinishing(true);
    try {
      const isAk = autoAk || training.problems.every((p) => p.solvedAt !== null);
      const performance = computePerformance({
        level: training.level,
        startTime: training.startTime,
        problems: training.problems,
      });
      const res = await fetch("/api/trainings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level_at_start: training.level,
          tag_filter: training.tagFilter,
          started_at: training.startTime,
          ends_at: training.endTime,
          performance,
          is_ak: isAk,
          problems: training.problems.map((p) => ({
            slot: p.slot,
            contestId: p.contestId,
            index: p.index,
            name: p.name,
            rating: p.rating,
            tags: p.tags,
            solvedAt: p.solvedAt,
          })),
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Failed");
      localStorage.removeItem(TRAINING_KEY);
      setTraining(null);
      await refreshSolved();
      router.push(`/history?just=${json.training_id}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setFinishing(false);
    }
  };

  const stop = () => {
    if (!confirm("Stop training? It won't be saved.")) return;
    localStorage.removeItem(TRAINING_KEY);
    setTraining(null);
    setSlots([]);
  };

  const isWarmup = training && Date.now() < training.startTime;
  const isLive = training && Date.now() >= training.startTime && Date.now() < training.endTime;
  const allSolved = training?.problems.every((p) => p.solvedAt !== null);

  if (poolErr) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
        Couldn&apos;t load Codeforces problems: {poolErr.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Round configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <Label>Level</Label>
              <select
                disabled={!!training}
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {allLevels().map((l) => (
                  <option key={l.id} value={Number(l.level)}>
                    {l.level} — {l.P1}/{l.P2}/{l.P3}/{l.P4} ({l.time}m)
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <Label>Contest ID range (freshness, optional)</Label>
              <div className="mt-1 flex gap-2">
                <Input
                  placeholder="from (e.g. 1500)"
                  value={rangeLb}
                  disabled={!!training}
                  onChange={(e) => setRangeLb(e.target.value)}
                />
                <Input
                  placeholder="to (e.g. 2200)"
                  value={rangeUb}
                  disabled={!!training}
                  onChange={(e) => setRangeUb(e.target.value)}
                />
                <Button variant="outline" onClick={applyRange} disabled={!!training}>
                  Apply
                </Button>
              </div>
            </div>
            <div>
              <Label>Active range</Label>
              <p className="mt-2 text-sm text-muted-foreground">
                {contestRange ? `${contestRange[0]} – ${contestRange[1]}` : "all contests"}
              </p>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Time per problem</Label>
            <div className="grid grid-cols-4 gap-2">
              {ratings.map((r, i) => (
                <Badge key={i} variant="outline" className="justify-center py-1">
                  P{i + 1}: {r}
                </Badge>
              ))}
            </div>
          </div>

          {!training && (
            <TagSelector
              selected={tagFilter}
              onToggle={onToggleTag}
              onClear={() => setTagFilter([])}
              onRandom={onRandomTag}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{training ? "Round in progress" : "Generated round"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!training && slots.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Pick your filters then hit Generate. The selector will only suggest problems you haven&apos;t already
              solved on Codeforces.
            </p>
          )}

          {(training ? training.problems : slots.map((s) => s.problem))
            .map((problem, i) => {
              const slotResult = slots[i];
              const fallback = !training ? slotResult?.fallback : "ok";
              const rating = problem?.rating ?? ratings[i];
              return (
                <div
                  key={i}
                  className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">P{i + 1}</Badge>
                      <Badge variant="outline">{rating}</Badge>
                      {problem ? (
                        <Link
                          href={problem.url}
                          target="_blank"
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {problem.contestId}{problem.index} · {problem.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">— no unsolved problem found —</span>
                      )}
                    </div>
                    {problem && (
                      <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                        {problem.tags.map((t) => (
                          <span key={t} className="rounded bg-secondary px-1.5 py-0.5">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    {!training && fallback && fallback !== "ok" && fallback !== "empty" && problem && (
                      <p className="flex items-center gap-1 text-xs text-amber-500">
                        <AlertCircle className="h-3 w-3" />
                        {fallback === "no-range" && "No in-range match — picked outside the contest range."}
                        {fallback === "no-tag" && "No tag match — picked an untagged problem at this rating."}
                      </p>
                    )}
                    {!training && fallback === "empty" && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        No unsolved problem at rating {rating} with these filters.
                      </p>
                    )}
                  </div>
                  {training && problem && (
                    <div className="text-sm">
                      {problem.solvedAt ? (
                        <span className="flex items-center gap-1 text-green-500">
                          <Check className="h-4 w-4" /> {Math.round((problem.solvedAt - training.startTime) / 60_000)}m
                        </span>
                      ) : (
                        <span className="text-muted-foreground">unsolved</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-wrap items-center gap-2">
            {!training && (
              <>
                <Button onClick={generate} disabled={poolLoading}>
                  <RefreshCw className="h-4 w-4" /> {slots.length === 0 ? "Generate" : "Regenerate"}
                </Button>
                {slots.length > 0 && slots.every((s) => s.problem) && (
                  <Button onClick={start}>
                    <Play className="h-4 w-4" /> Start
                  </Button>
                )}
              </>
            )}
            {training && (
              <>
                <CountdownTimer
                  startTime={training.startTime}
                  endTime={training.endTime}
                  onExpire={() => void finish(false)}
                />
                <Button variant="outline" onClick={refreshSubmissions} disabled={!isLive}>
                  <RefreshCw className="h-4 w-4" /> Refresh
                </Button>
                <Button onClick={() => void finish(allSolved ?? false)} disabled={finishing || !!isWarmup}>
                  Finish now
                </Button>
                <Button variant="destructive" onClick={stop} disabled={finishing}>
                  <Square className="h-4 w-4" /> Stop
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
