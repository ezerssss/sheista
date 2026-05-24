import { TIERS, tierColor, getTierByLevel } from "@/lib/themecp/tiers";

export function TierRail({ currentLevel }: { currentLevel: number }) {
  const current = getTierByLevel(currentLevel);
  return (
    <section className="space-y-3">
      <p className="label-eyebrow">Tiers</p>
      <div className="flex flex-wrap gap-2">
        {TIERS.map((t) => {
          const isCurrent = t.id === current.id;
          const color = tierColor(t);
          return (
            <a
              key={t.id}
              href={`#tier-${t.id}`}
              className="group flex items-baseline gap-2 rounded-md border px-3 py-2 text-xs transition-colors hover:bg-muted/40"
              style={{
                borderColor: isCurrent ? color : "hsl(var(--border))",
                backgroundColor: isCurrent ? tierColor(t, 0.1) : undefined,
                boxShadow: isCurrent ? `0 0 0 1px ${tierColor(t, 0.5)}` : undefined,
              }}
            >
              <span className="font-medium" style={{ color }}>
                {t.name}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {t.minLevel}–{t.maxLevel}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
