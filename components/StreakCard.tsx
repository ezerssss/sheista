import { cn } from "@/lib/utils";

export function StreakCard({
  current,
  longest,
  todayDone,
}: {
  current: number;
  longest: number;
  todayDone: boolean;
}) {
  const status = todayDone
    ? "today complete"
    : current > 0
      ? "keep it alive before midnight — even one problem"
      : "any practice counts — bite, upsolve, or round";
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="label-eyebrow">streak</p>
        <span className="font-mono text-[10px] text-muted-foreground">
          longest {longest}
        </span>
      </div>
      <div className="flex items-baseline gap-3">
        <span
          className={cn(
            "font-mono text-5xl font-light tabular-nums tracking-tightest",
            current > 0 ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {current}
        </span>
        <span className="text-xs text-muted-foreground">
          {current === 1 ? "day" : "days"}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            todayDone ? "bg-accent" : current > 0 ? "bg-accent/50" : "bg-muted-foreground/40",
          )}
        />
        <span className={cn("text-muted-foreground", todayDone && "text-accent")}>
          {status}
        </span>
      </div>
    </div>
  );
}
