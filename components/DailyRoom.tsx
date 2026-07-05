"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, RefreshCw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useSolvedProblems } from "@/hooks/useProblems";
import { useCfSubmissionPolling } from "@/hooks/useCfSubmissionPolling";
import {
  type ActiveDaily,
  clearActiveDaily,
  getActiveDaily,
  getActiveTraining,
  setActiveDaily as persistActiveDaily,
} from "@/lib/themecp/active-training";
import { emitTrainingFinished } from "@/lib/pet/events";

const SOURCE_LABEL: Record<ActiveDaily["source"], string> = {
  upsolve: "from your upsolve pile — clearing old debts",
  "weak-tag": "from your weakest tag — targeted rep",
  random: "picked at your level",
};

export function DailyRoom({ handle, level }: { handle: string; level: number }) {
  const router = useRouter();
  const { refresh: refreshSolved } = useSolvedProblems(handle);
  const [daily, setDaily] = useState<ActiveDaily | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [overtime, setOvertime] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate from localStorage; one practice at a time — a live full round
  // outranks a bite.
  useEffect(() => {
    if (getActiveTraining()) {
      router.replace("/round");
      return;
    }
    const d = getActiveDaily();
    if (!d) {
      router.replace("/dashboard");
      return;
    }
    setDaily(d);
    setOvertime(Date.now() >= d.softEndTime);
    setHydrated(true);
  }, [router]);

  // Keep localStorage current so refreshes (and failed saves) resume cleanly.
  useEffect(() => {
    if (daily && !done) persistActiveDaily(daily);
  }, [daily, done]);

  const {
    submissions,
    error: pollError,
    refresh: refreshSubmissions,
  } = useCfSubmissionPolling(handle, { enabled: !!daily && !done });

  useEffect(() => {
    if (!submissions) return;
    setDaily((prev) => {
      if (!prev || prev.problem.solvedAt) return prev;
      const okSub = submissions.find(
        (s) =>
          s.verdict === "OK" &&
          s.problem.contestId === prev.problem.contestId &&
          s.problem.index === prev.problem.index &&
          s.creationTimeSeconds * 1000 >= prev.startTime,
      );
      if (!okSub) return prev;
      return {
        ...prev,
        problem: { ...prev.problem, solvedAt: okSub.creationTimeSeconds * 1000 },
      };
    });
  }, [submissions]);

  // Solve detected → record it. Retries on remount if the POST fails (the
  // solved bite stays in localStorage; the server dedupes on day_key).
  useEffect(() => {
    if (!daily?.problem.solvedAt || done || saving) return;
    void save(daily);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daily?.problem.solvedAt, done]);

  const save = async (d: ActiveDaily) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contest_id: d.problem.contestId,
          problem_index: d.problem.index,
          problem_name: d.problem.name,
          rating: d.problem.rating,
          tags: d.problem.tags,
          source: d.source,
          started_at: d.startTime,
          solved_at: d.problem.solvedAt,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Failed to save");
      clearActiveDaily();
      setDone(true);
      // Same event bus as rounds; levelBefore === levelAfter so the level
      // overlay stays quiet — the pet reacts gently instead.
      emitTrainingFinished({
        kind: "daily",
        isAk: true,
        performance: 0,
        levelBefore: level,
        levelAfter: level,
      });
      await refreshSolved();
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const skip = () => {
    if (!confirm("Skip today's bite? Nothing gets recorded.")) return;
    clearActiveDaily();
    setDaily(null);
    router.replace("/dashboard");
  };

  if (!hydrated || !daily) {
    return <p className="text-sm text-muted-foreground">Loading daily bite…</p>;
  }

  const solved = daily.problem.solvedAt !== null;

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <header className="space-y-2">
        <p className="label-eyebrow">Daily bite</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          One problem. That&apos;s the whole assignment.
        </h1>
        <p className="text-sm text-muted-foreground">{SOURCE_LABEL[daily.source]}</p>
        {pollError && !done && (
          <p className="text-xs text-amber-500/80">{pollError}</p>
        )}
      </header>

      <section className="space-y-4">
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="flex flex-col gap-2 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted-foreground">
                {daily.problem.rating || "?"}
              </span>
              <Link
                href={daily.problem.url}
                target="_blank"
                className="text-sm font-medium underline-offset-4 hover:underline"
              >
                <span className="font-mono text-muted-foreground">
                  {daily.problem.contestId}
                  {daily.problem.index}
                </span>{" "}
                {daily.problem.name}
              </Link>
            </div>
            {solved ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-accent">
                <Check className="h-3.5 w-3.5" />
                <span className="font-mono">
                  {Math.max(0, Math.round((daily.problem.solvedAt! - daily.startTime) / 60_000))}m
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

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={() => void save(daily)} disabled={saving}>
              Retry save
            </Button>
          </div>
        )}

        {done ? (
          <div className="space-y-4 rounded-lg border border-accent/40 bg-accent/5 px-5 py-6 text-center">
            <p className="text-lg font-medium">that&apos;s the day handled · streak safe</p>
            <p className="text-sm text-muted-foreground">
              no level math, no pressure. the full round will be there when you have the time.
            </p>
            <Button asChild size="sm">
              <Link href="/dashboard">
                <ArrowRight className="h-3.5 w-3.5" />
                Back to dashboard
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-5 py-4">
            {overtime ? (
              <span className="text-sm text-muted-foreground">
                past 15m — no pressure, it still counts
              </span>
            ) : (
              <CountdownTimer
                startTime={daily.startTime}
                endTime={daily.softEndTime}
                onExpire={() => setOvertime(true)}
              />
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refreshSubmissions()}
                disabled={saving}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
              <Button variant="ghost" size="sm" onClick={skip} disabled={saving}>
                <Square className="h-3.5 w-3.5" />
                Not today
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
