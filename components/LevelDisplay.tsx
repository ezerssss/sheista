import { cn } from "@/lib/utils";
import { getLevel, ratingsOfLevel } from "@/lib/themecp/levels";

export function LevelDisplay({ level, hideRatings = false }: { level: number; hideRatings?: boolean }) {
  const l = getLevel(level);
  const ratings = ratingsOfLevel(l);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="label-eyebrow">level</p>
        <span className="font-mono text-[10px] text-muted-foreground">
          {l.time}m
        </span>
      </div>
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-5xl font-light tabular-nums tracking-tightest text-foreground">
          {l.level}
        </span>
        <span className="text-xs text-muted-foreground">
          target perf{" "}
          <span className="font-mono text-foreground">{l.Performance}</span>
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {ratings.map((r, i) => (
          <div
            key={i}
            className="rounded-sm border border-border/70 px-2 py-1.5 text-center"
          >
            <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
              p{i + 1}
            </div>
            <div
              className={cn(
                "font-mono text-sm tabular-nums text-foreground",
                hideRatings && "select-none blur-sm",
              )}
            >
              {r}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
