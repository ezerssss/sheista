"use client";

import { PetSprite } from "@/components/pet/PetSprite";
import { shiftDayKey } from "@/lib/time/day-key";
import type { MoodId } from "@/lib/pet/types";
import type { ShareCardData, ShareFormat } from "@/components/share/types";

const HEATMAP_DAYS = 30;

function colorForCount(c: number): string {
  if (c <= 0) return "#1a1a1a";
  if (c === 1) return "#0e4429";
  if (c === 2) return "#006d32";
  if (c === 3) return "#26a641";
  return "#39d353";
}

function HeatmapStrip({
  heatmap,
  today,
}: {
  heatmap: ShareCardData["heatmap"];
  today: string;
}) {
  const map = new Map(heatmap.map((d) => [d.date, d.count]));
  const cells: { key: string; count: number }[] = [];
  for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
    const key = shiftDayKey(today, -i);
    cells.push({ key, count: map.get(key) ?? 0 });
  }
  return (
    <div className="flex w-full justify-between gap-3">
      {cells.map((c) => (
        <div
          key={c.key}
          className="aspect-square flex-1 rounded-md"
          style={{ background: colorForCount(c.count) }}
        />
      ))}
    </div>
  );
}

export function CardFrame({
  data,
  format,
  petMood,
  children,
}: {
  data: ShareCardData;
  format: ShareFormat;
  petMood: MoodId;
  children: React.ReactNode;
}) {
  const isWide = format === "wide";

  const padding = isWide ? "p-16" : "p-20";
  const wordmarkSize = isWide ? "text-5xl" : "text-7xl";
  const subtitleSize = isWide ? "text-xl" : "text-2xl";
  const handleSize = isWide ? "text-3xl" : "text-5xl";
  const handleSubSize = isWide ? "text-xl" : "text-2xl";
  const heatmapLabelSize = isWide ? "text-xl" : "text-2xl";

  return (
    <div
      className={`relative flex h-full w-full flex-col bg-background text-foreground ${padding}`}
      style={{
        fontFamily: "var(--font-sans)",
        background:
          "radial-gradient(circle at 20% 0%, hsl(var(--accent) / 0.10), transparent 50%), hsl(var(--background))",
      }}
    >
      {/* Header */}
      <header className="flex items-start justify-between">
        <div className="space-y-2">
          <p className={`font-semibold tracking-tight ${wordmarkSize}`}>sheista</p>
          <p
            className={`uppercase tracking-[0.25em] text-muted-foreground ${subtitleSize}`}
          >
            themecp tracker
          </p>
        </div>
        <div className="space-y-2 text-right">
          <p className={`font-mono font-medium ${handleSize}`}>
            <span className="text-muted-foreground">@</span>
            {data.cfHandle}
          </p>
          {data.cfRating != null && (
            <p
              className={`font-mono text-muted-foreground ${handleSubSize}`}
            >
              cf {data.cfRating}
            </p>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        {children}
      </div>

      {/* Footer: heatmap + chicken */}
      <footer className="flex items-end justify-between gap-12">
        <div className="flex-1 space-y-4">
          <p
            className={`uppercase tracking-[0.25em] text-muted-foreground ${heatmapLabelSize}`}
          >
            last 30 days
          </p>
          <HeatmapStrip heatmap={data.heatmap} today={data.todayKey} />
        </div>
        <PetSprite mood={petMood} pixelSize={isWide ? 6 : 8} />
      </footer>
    </div>
  );
}
