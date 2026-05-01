"use client";

import { CardFrame } from "@/components/share/templates/CardFrame";
import type { ShareCardData, ShareFormat } from "@/components/share/types";

function streakWord(n: number): string {
  if (n >= 365) return "an entire year";
  if (n >= 100) return "triple digits";
  if (n >= 30) return "a full month strong";
  if (n >= 14) return "two weeks deep";
  if (n >= 7) return "seven days strong";
  if (n >= 3) return "warming up";
  return "day one energy";
}

export function StreakTemplate({
  data,
  format,
}: {
  data: ShareCardData;
  format: ShareFormat;
}) {
  const isWide = format === "wide";
  return (
    <CardFrame data={data} format={format} petMood="proud">
      <p
        className={`uppercase tracking-[0.22em] text-muted-foreground ${isWide ? "text-xl" : "text-3xl"}`}
      >
        streak
      </p>
      <p
        className="mt-6 font-mono font-light tabular-nums tracking-tightest text-accent"
        style={{ fontSize: isWide ? "14rem" : "22rem", lineHeight: 0.9 }}
      >
        {data.streakCurrent}
      </p>
      <p
        className={`mt-2 font-mono text-muted-foreground ${isWide ? "text-3xl" : "text-5xl"}`}
      >
        day{data.streakCurrent === 1 ? "" : "s"}
      </p>
      <p
        className={`mt-12 font-semibold tracking-tight ${isWide ? "text-5xl" : "text-7xl"}`}
      >
        {streakWord(data.streakCurrent)}
      </p>
      <p
        className={`mt-8 font-mono text-muted-foreground ${isWide ? "text-2xl" : "text-3xl"}`}
      >
        longest {data.streakLongest}d · level {data.level} · {data.akRate}% AK
      </p>
    </CardFrame>
  );
}
