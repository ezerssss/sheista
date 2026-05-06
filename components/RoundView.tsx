import Link from "next/link";
import { ArrowLeft, Check, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ProblemRow = {
  slot: number;
  contest_id: number;
  problem_index: string;
  problem_name: string;
  rating: number;
  tags: string[];
  solved_at: string | null;
};

export type RoundViewTraining = {
  id: string;
  started_at: string;
  ends_at: string;
  finished_at: string;
  performance: number;
  is_ak: boolean;
  level_at_start: number;
  level_at_end: number;
  tag_filter: string[];
  training_problems: ProblemRow[];
};

export function RoundView({
  training,
  upsolvedSet,
}: {
  training: RoundViewTraining;
  upsolvedSet: Set<string>;
}) {
  const problems = [...training.training_problems].sort((a, b) => a.slot - b.slot);
  const solvedCount = problems.filter((p) => p.solved_at).length;
  const startMs = new Date(training.started_at).getTime();
  const endMs = new Date(training.ends_at).getTime();
  const durationMin = Math.round((endMs - startMs) / 60_000);

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <p className="label-eyebrow">Past round</p>
          <Link
            href="/history"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            back to history
          </Link>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Level {training.level_at_start} · {solvedCount}/4 solved
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
          <Badge variant={training.is_ak ? "accent" : "muted"}>
            {training.is_ak ? "AK" : "no AK"}
          </Badge>
          <span>
            Level{" "}
            <span className="font-mono text-foreground">{training.level_at_start}</span>
            <span className="mx-1">→</span>
            <span className="font-mono text-foreground">{training.level_at_end}</span>
          </span>
          <span>
            perf <span className="font-mono text-foreground">{training.performance}</span>
          </span>
          <span>
            <span className="font-mono text-foreground">{durationMin}m</span> window
          </span>
          <span className="font-mono text-xs">
            {new Date(training.finished_at).toLocaleString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {training.tag_filter.length > 0 && (
            <span className="text-xs">
              {training.tag_filter.map((t) => `#${t}`).join(" ")}
            </span>
          )}
        </div>
      </header>

      <section className="overflow-hidden rounded-lg border border-border">
        {problems.map((p, i) => {
          const solved = !!p.solved_at;
          const isUpsolved =
            !solved && upsolvedSet.has(`${p.contest_id}_${p.problem_index}`);
          const url = `https://codeforces.com/contest/${p.contest_id}/problem/${p.problem_index}`;
          return (
            <div
              key={p.slot}
              className={cn(
                "flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
                i > 0 && "border-t border-border",
                solved && "bg-accent/5",
              )}
            >
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border font-mono text-[10px] text-muted-foreground">
                    {p.slot}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {p.rating}
                  </span>
                  <Link
                    href={url}
                    target="_blank"
                    className="text-sm font-medium underline-offset-4 hover:underline"
                  >
                    <span className="font-mono text-muted-foreground">
                      {p.contest_id}
                      {p.problem_index}
                    </span>{" "}
                    {p.problem_name}
                  </Link>
                </div>
                {p.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pl-9 text-[11px] text-muted-foreground">
                    {p.tags.map((t) => (
                      <span key={t}>#{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pl-9 sm:pl-0">
                {solved ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-accent">
                    <Check className="h-3.5 w-3.5" />
                    <span className="font-mono">
                      {Math.round((new Date(p.solved_at!).getTime() - startMs) / 60_000)}
                      m
                    </span>
                  </span>
                ) : isUpsolved ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                    <Clock className="h-3.5 w-3.5" />
                    upsolved later
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
      </section>
    </div>
  );
}
