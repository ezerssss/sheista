"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RefreshCw, Square, Check, ArrowRight, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useSolvedProblems } from "@/hooks/useProblems";
import { useCfSubmissionPolling } from "@/hooks/useCfSubmissionPolling";
import { computePerformance } from "@/lib/themecp/performance";
import {
  type ActiveTraining,
  clearActiveTraining,
  getActiveTraining,
  setActiveTraining as persistActiveTraining,
} from "@/lib/themecp/active-training";
import { emitTrainingFinished } from "@/lib/pet/events";
import { cn } from "@/lib/utils";

export function RoundRoom({ handle }: { handle: string }) {
  const router = useRouter();
  const { refresh: refreshSolved } = useSolvedProblems(handle);
  const [training, setTraining] = useState<ActiveTraining | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // True once the round has finished (timer expiry, AK auto-finish, or the
  // Finish-now button). Drives the in-room reveal AND prevents auto-navigating
  // to /history so the LevelChangeOverlay has time to render.
  const [roundOver, setRoundOver] = useState(false);
  // training.id from the POST /api/trainings response. Captured when the
  // timer-expiry save runs without redirecting, so the "View results" button
  // can deep-link into the matching history row.
  const [savedTrainingId, setSavedTrainingId] = useState<string | null>(null);

  // Hydrate from localStorage on mount; if there's nothing live, bounce to dashboard.
  useEffect(() => {
    const t = getActiveTraining();
    if (!t) {
      router.replace("/dashboard");
      return;
    }
    setTraining(t);
    setHydrated(true);
  }, [router]);

  // Persist any in-memory edits back to localStorage so a refresh keeps state.
  // Skip once roundOver flips — at that point we are about to (or already did)
  // call clearActiveTraining(), and persisting a stale copy would resurrect the
  // round on the next /round mount and re-trigger AK auto-finish.
  useEffect(() => {
    if (training && !roundOver) persistActiveTraining(training);
  }, [training, roundOver]);

  // Auto-detect AK polling. The hook owns the interval + error state; this
  // component just folds fresh submissions into the round.
  const {
    submissions,
    error: pollError,
    refresh: refreshSubmissions,
  } = useCfSubmissionPolling(handle, { enabled: !!training && !roundOver });
  useEffect(() => {
    if (!submissions) return;
    setTraining((prev) => {
      if (!prev) return prev;
      let changed = false;
      const updatedProblems = prev.problems.map((p) => {
        if (p.solvedAt) return p;
        const okSub = submissions.find(
          (s) =>
            s.verdict === "OK" &&
            s.problem.contestId === p.contestId &&
            s.problem.index === p.index &&
            s.creationTimeSeconds * 1000 >= prev.startTime,
        );
        if (!okSub) return p;
        changed = true;
        return { ...p, solvedAt: okSub.creationTimeSeconds * 1000 };
      });
      return changed ? { ...prev, problems: updatedProblems } : prev;
    });
  }, [submissions]);

  // Auto-finish on AK. Hold the user in-room (navigate:false) so the
  // level-up overlay has time to render — they'll click "View results" to go
  // to /history themselves.
  useEffect(() => {
    if (!training || roundOver) return;
    const all = training.problems.every((p) => p.solvedAt !== null);
    if (all) {
      setRoundOver(true);
      void finish(true, { navigate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [training?.problems, roundOver]);

  const finish = async (autoAk: boolean, opts: { navigate?: boolean } = {}) => {
    if (!training || finishing) return;
    const navigate = opts.navigate ?? true;
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
          client_round_id: training.id,
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
      // Always purge the localStorage record once the server has accepted the
      // round — this is the only thing that prevents browser-back / direct URL
      // re-entry from re-mounting RoundRoom and re-firing AK auto-finish.
      // Server-side dedupe (client_round_id) is the second line of defense.
      clearActiveTraining();
      emitTrainingFinished({
        isAk,
        performance,
        levelBefore: training.level,
        levelAfter: typeof json.level === "number" ? json.level : training.level,
      });
      await refreshSolved();
      // Invalidate the Next.js router cache so any subsequent navigation
      // (View results, dashboard, heatmap, tags, …) re-renders with the
      // post-round profile.level, streak, and training counts. Without this
      // the user sees pre-round numbers until a hard reload.
      router.refresh();
      if (navigate) {
        setTraining(null);
        router.push(`/history?just=${json.training_id}`);
      } else {
        setSavedTrainingId(json.training_id);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setFinishing(false);
    }
  };

  const stop = () => {
    if (!confirm("Stop round? It won't be saved.")) return;
    clearActiveTraining();
    setTraining(null);
    router.replace("/dashboard");
  };

  const isWarmup = training && Date.now() < training.startTime;
  const isLive = training && Date.now() >= training.startTime && Date.now() < training.endTime;
  const allSolved = training?.problems.every((p) => p.solvedAt !== null);
  const solvedCount = training?.problems.filter((p) => p.solvedAt).length ?? 0;
  // Tags stay hidden during warmup + live. Revealed once the round is over
  // (timer expired, AK auto-finish, or Finish-now click).
  const revealTags = roundOver;

  if (!hydrated || !training) {
    return <p className="text-sm text-muted-foreground">Loading round…</p>;
  }

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="label-eyebrow">Round in progress</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Level {training.level} · {solvedCount}/4 solved
        </h1>
        <p className="text-sm text-muted-foreground">
          Auto-detect every 30 s. Submissions go through Codeforces — opening each problem in a new
          tab.
        </p>
        {pollError && !roundOver && (
          <p className="text-xs text-amber-500/80">{pollError}</p>
        )}
      </header>

      <section className="space-y-4">
        <div className="overflow-hidden rounded-lg border border-border">
          {training.problems.map((problem, i) => {
            const solved = problem.solvedAt !== null;
            return (
              <div
                key={i}
                className={cn(
                  "flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
                  i > 0 && "border-t border-border",
                  solved && "bg-accent/5",
                )}
              >
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border font-mono text-[10px] text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{problem.rating}</span>
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
                  </div>
                  {problem.tags.length > 0 && revealTags && (
                    <div className="flex flex-wrap gap-1 pl-9 text-[11px] text-muted-foreground">
                      {problem.tags.map((t) => (
                        <span key={t}>#{t}</span>
                      ))}
                    </div>
                  )}
                  {problem.tags.length > 0 && !revealTags && (
                    <div className="flex items-center gap-1.5 pl-9 text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
                      <EyeOff className="h-3 w-3" />
                      tags hidden
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 pl-9 sm:pl-0">
                  {problem.solvedAt ? (
                    <span className="inline-flex items-center gap-1.5 text-sm text-accent">
                      <Check className="h-3.5 w-3.5" />
                      <span className="font-mono">
                        {Math.round((problem.solvedAt - training.startTime) / 60_000)}m
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                      unsolved
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-5 py-4">
          <CountdownTimer
            startTime={training.startTime}
            endTime={training.endTime}
            onExpire={() => {
              if (roundOver) return;
              setRoundOver(true);
              void finish(false, { navigate: false });
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            {roundOver ? (
              <Button asChild size="sm" disabled={finishing}>
                <Link href={savedTrainingId ? `/history?just=${savedTrainingId}` : "/history"}>
                  <ArrowRight className="h-3.5 w-3.5" />
                  {finishing ? "Saving…" : "View results"}
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={refreshSubmissions} disabled={!isLive}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setRoundOver(true);
                    void finish(allSolved ?? false, { navigate: false });
                  }}
                  disabled={finishing || !!isWarmup}
                >
                  Finish now
                </Button>
                <Button variant="ghost" size="sm" onClick={stop} disabled={finishing}>
                  <Square className="h-3.5 w-3.5" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
