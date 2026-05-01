"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { TagStat } from "@/lib/themecp/tag-stats";

const colorFor = (rate: number) => {
  if (rate >= 0.66) return "#22c55e";
  if (rate >= 0.33) return "#eab308";
  return "#ef4444";
};

export function TagMasteryChart({ stats }: { stats: TagStat[] }) {
  const data = stats.map((s) => ({ ...s, akPct: Math.round(s.akRate * 100) }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 28)}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
        <YAxis type="category" dataKey="tag" width={140} stroke="hsl(var(--muted-foreground))" />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            borderColor: "hsl(var(--border))",
            color: "hsl(var(--card-foreground))",
          }}
          formatter={(v: number, _name, p) => {
            const s = p.payload as TagStat & { akPct: number };
            return [`${s.akPct}% AK · avg perf ${s.avgPerformance} · ${s.rounds} rounds`, "mastery"];
          }}
        />
        <Bar dataKey="akPct" name="AK rate %">
          {data.map((s, i) => (
            <Cell key={i} fill={colorFor(s.akRate)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
