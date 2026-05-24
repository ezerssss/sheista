import { MAX_LEVEL, tierColor, tierProgress } from "@/lib/themecp/tiers";
import { getLevel } from "@/lib/themecp/levels";

export function LadderHero({ currentLevel }: { currentLevel: number }) {
  const { tier, next, levelsIntoTier, tierSize, levelsToNextTier, pct } =
    tierProgress(currentLevel);
  const lvl = getLevel(currentLevel);
  const color = tierColor(tier);
  const tint = tierColor(tier, 0.12);
  const border = tierColor(tier, 0.4);

  return (
    <section
      className="rounded-lg border p-8"
      style={{ backgroundColor: tint, borderColor: border }}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <p className="label-eyebrow" style={{ color }}>
            {tier.name}
          </p>
          <div className="flex items-baseline gap-4">
            <span
              className="font-mono text-7xl font-light tabular-nums tracking-tightest"
              style={{ color }}
            >
              {lvl.level}
            </span>
            <span className="text-sm text-muted-foreground">
              of <span className="font-mono text-foreground">{MAX_LEVEL}</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            target perf{" "}
            <span className="font-mono text-foreground">{lvl.Performance}</span>
            <span className="mx-2 text-border">·</span>
            <span className="font-mono text-foreground">{lvl.time}m</span> round
          </p>
        </div>

        <div className="w-full max-w-xs space-y-2 sm:w-72">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">
              {levelsIntoTier} of {tierSize} in {tier.shortName}
            </span>
            <span className="font-mono text-foreground">
              {Math.round(pct * 100)}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full transition-all"
              style={{ width: `${pct * 100}%`, backgroundColor: color }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {next ? (
              <>
                <span className="font-mono text-foreground">
                  {levelsToNextTier}
                </span>{" "}
                level{levelsToNextTier === 1 ? "" : "s"} to{" "}
                <span style={{ color: tierColor(next) }}>{next.name}</span>
              </>
            ) : (
              <>top of the ladder. respect.</>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
