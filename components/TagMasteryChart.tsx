"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { TagStat } from "@/lib/themecp/tag-stats";

const colorFor = (rate: number) => {
  if (rate >= 0.66) return "hsl(142 55% 36%)";
  if (rate >= 0.33) return "hsl(38 80% 50%)";
  return "hsl(0 65% 50%)";
};

export function TagMasteryChart({ stats }: { stats: TagStat[] }) {
  const data = stats.map((s) => ({ ...s, akPct: Math.round(s.akRate * 100) }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 26)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
        <XAxis
          type="number"
          domain={[0, 100]}
          stroke="hsl(var(--border))"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v}%`}
        />
        <YAxis
          type="category"
          dataKey="tag"
          width={150}
          stroke="hsl(var(--border))"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            borderColor: "hsl(var(--border))",
            borderRadius: "var(--radius)",
            color: "hsl(var(--popover-foreground))",
            fontSize: "12px",
          }}
          cursor={{ fill: "hsl(var(--muted) / 0.5)" }}
          formatter={(v: number, _name, p) => {
            const s = p.payload as TagStat & { akPct: number };
            return [
              `${s.akPct}% AK · avg perf ${s.avgPerformance} · ${s.rounds} rounds`,
              "mastery",
            ];
          }}
        />
        <Bar dataKey="akPct" name="AK rate %" radius={[0, 2, 2, 0]}>
          {data.map((s, i) => (
            <Cell key={i} fill={colorFor(s.akRate)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
