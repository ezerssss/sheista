import { allLevels, ratingsOfLevel } from "@/lib/themecp/levels";
import { TIERS, tierColor, type Tier } from "@/lib/themecp/tiers";
import { cn } from "@/lib/utils";

export function LadderList({ currentLevel }: { currentLevel: number }) {
  const levels = allLevels();
  return (
    <section className="space-y-10">
      {TIERS.map((tier) => {
        const tierLevels = levels.filter((l) => {
          const n = Number(l.level);
          return n >= tier.minLevel && n <= tier.maxLevel;
        });
        if (tierLevels.length === 0) return null;
        const color = tierColor(tier);
        return (
          <div key={tier.id} id={`tier-${tier.id}`} className="space-y-3">
            <TierHeader tier={tier} count={tierLevels.length} />
            <div className="overflow-hidden rounded-lg border border-border">
              {tierLevels.map((l, idx) => {
                const lvlNum = Number(l.level);
                const isCurrent = lvlNum === currentLevel;
                const ratings = ratingsOfLevel(l);
                return (
                  <div
                    key={l.id}
                    data-current={isCurrent ? "true" : undefined}
                    className={cn(
                      "grid grid-cols-[auto_1fr_auto] items-center gap-x-4 border-l-4 border-transparent px-4 py-3 transition-colors sm:grid-cols-[3.5rem_1fr_auto]",
                      idx !== 0 && "border-t border-t-border/70",
                      !isCurrent && "hover:bg-muted/30",
                    )}
                    style={
                      isCurrent
                        ? {
                            backgroundColor: tierColor(tier, 0.12),
                            borderLeftColor: color,
                          }
                        : undefined
                    }
                  >
                    <span
                      className="font-mono text-2xl font-light tabular-nums tracking-tightest"
                      style={{ color: isCurrent ? color : undefined }}
                    >
                      {l.level}
                    </span>

                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        target perf{" "}
                        <span className="font-mono text-foreground">
                          {l.Performance}
                        </span>
                      </span>
                      <span>
                        <span className="font-mono text-foreground">{l.time}m</span>{" "}
                        round
                      </span>
                      {isCurrent && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em]"
                          style={{
                            backgroundColor: tierColor(tier, 0.2),
                            color,
                          }}
                        >
                          you are here
                        </span>
                      )}
                    </div>

                    <div className="col-span-3 grid grid-cols-4 gap-1.5 sm:col-span-1 sm:w-56">
                      {ratings.map((r, i) => (
                        <div
                          key={i}
                          className="rounded-sm border border-border/70 px-2 py-1.5 text-center"
                        >
                          <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
                            p{i + 1}
                          </div>
                          <div className="font-mono text-sm tabular-nums text-foreground">
                            {r}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function TierHeader({ tier, count }: { tier: Tier; count: number }) {
  const color = tierColor(tier);
  return (
    <div
      className="sticky top-[64px] z-10 -mx-2 flex items-baseline justify-between rounded-md border bg-background/85 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/65"
      style={{ borderColor: tierColor(tier, 0.4) }}
    >
      <div className="flex items-baseline gap-3">
        <span className="text-base font-semibold tracking-tight" style={{ color }}>
          {tier.name}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          levels {tier.minLevel}–{tier.maxLevel}
        </span>
      </div>
      <span className="font-mono text-[11px] text-muted-foreground">
        {count} {count === 1 ? "rung" : "rungs"}
      </span>
    </div>
  );
}
