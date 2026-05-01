"use client";

import { CardFrame } from "@/components/share/templates/CardFrame";
import type { ShareCardData, ShareFormat } from "@/components/share/types";

function dateLabel(d = new Date()): string {
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DailyRecapTemplate({
  data,
  format,
}: {
  data: ShareCardData;
  format: ShareFormat;
}) {
  const status = data.todayDone ? "round complete" : "round pending";
  const isWide = format === "wide";
  return (
    <CardFrame data={data} format={format} petMood={data.todayDone ? "proud" : "nudging"}>
      <p
        className={`uppercase tracking-[0.22em] text-muted-foreground ${isWide ? "text-xl" : "text-3xl"}`}
      >
        {dateLabel()}
      </p>
      <p
        className={`mt-4 uppercase tracking-[0.18em] text-muted-foreground ${isWide ? "text-2xl" : "text-4xl"}`}
      >
        today's training
      </p>
      <p
        className="mt-10 font-mono font-light tabular-nums tracking-tightest text-foreground"
        style={{ fontSize: isWide ? "12rem" : "18rem", lineHeight: 1 }}
      >
        {data.todayDone ? "✓" : "—"}
      </p>
      <p
        className={`mt-6 font-semibold tracking-tight ${isWide ? "text-5xl" : "text-7xl"}`}
      >
        {status}
      </p>
      <div className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
        <Stat label="level" value={String(data.level)} wide={isWide} />
        <Dot wide={isWide} />
        <Stat
          label="streak"
          value={`${data.streakCurrent}d`}
          wide={isWide}
        />
        <Dot wide={isWide} />
        <Stat label="AK rate" value={`${data.akRate}%`} wide={isWide} />
        <Dot wide={isWide} />
        <Stat label="rounds" value={String(data.totalRounds)} wide={isWide} />
      </div>
    </CardFrame>
  );
}

function Stat({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide: boolean;
}) {
  return (
    <div className="text-left">
      <p
        className={`uppercase tracking-[0.2em] text-muted-foreground ${wide ? "text-base" : "text-2xl"}`}
      >
        {label}
      </p>
      <p
        className={`font-mono font-medium tabular-nums text-foreground ${wide ? "text-4xl" : "text-6xl"}`}
      >
        {value}
      </p>
    </div>
  );
}

function Dot({ wide }: { wide: boolean }) {
  return (
    <span className={`text-border ${wide ? "text-3xl" : "text-5xl"}`}>·</span>
  );
}
