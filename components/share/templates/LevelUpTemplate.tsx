"use client";

import { ArrowUp } from "lucide-react";
import { CardFrame } from "@/components/share/templates/CardFrame";
import type { ShareCardData, ShareFormat } from "@/components/share/types";

export function LevelUpTemplate({
  data,
  format,
}: {
  data: ShareCardData;
  format: ShareFormat;
}) {
  const before = data.levelBefore ?? Math.max(1, data.level - 1);
  const isWide = format === "wide";
  return (
    <CardFrame data={data} format={format} petMood="celebrating">
      <p
        className={`uppercase tracking-[0.22em] text-muted-foreground ${isWide ? "text-xl" : "text-3xl"}`}
      >
        level up
      </p>
      <div className="mt-10 flex items-baseline justify-center gap-10">
        <p
          className="font-mono font-light tabular-nums tracking-tightest text-muted-foreground"
          style={{ fontSize: isWide ? "8rem" : "12rem", lineHeight: 1 }}
        >
          {before}
        </p>
        <ArrowUp
          className={`text-accent ${isWide ? "h-24 w-24" : "h-36 w-36"}`}
          strokeWidth={2.5}
        />
        <p
          className="font-mono font-light tabular-nums tracking-tightest text-accent"
          style={{ fontSize: isWide ? "10rem" : "16rem", lineHeight: 1 }}
        >
          {data.level}
        </p>
      </div>
      <p
        className={`mt-14 font-semibold tracking-tight ${isWide ? "text-5xl" : "text-7xl"}`}
      >
        @{data.cfHandle} leveled up
      </p>
      <p
        className={`mt-6 font-mono text-muted-foreground ${isWide ? "text-2xl" : "text-3xl"}`}
      >
        {data.streakCurrent}-day streak · {data.totalRounds} rounds · {data.akRate}% AK
      </p>
    </CardFrame>
  );
}
