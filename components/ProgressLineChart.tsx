"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Point = { date: number; performance: number; level: number };

const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  borderColor: "hsl(var(--border))",
  borderRadius: "var(--radius)",
  color: "hsl(var(--popover-foreground))",
  fontSize: "12px",
};

export function ProgressLineChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          type="number"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(v: number) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          stroke="hsl(var(--border))"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickLine={false}
        />
        <YAxis
          stroke="hsl(var(--border))"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip
          labelFormatter={(v: number) => new Date(v).toLocaleString()}
          contentStyle={tooltipStyle}
          cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "3 3" }}
        />
        <Line
          type="monotone"
          dataKey="performance"
          name="Performance"
          stroke="hsl(var(--foreground))"
          strokeWidth={1.5}
          dot={{ fill: "hsl(var(--foreground))", r: 2.5, strokeWidth: 0 }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function LevelLineChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          type="number"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(v: number) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          stroke="hsl(var(--border))"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickLine={false}
        />
        <YAxis
          stroke="hsl(var(--border))"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={30}
        />
        <Tooltip
          labelFormatter={(v: number) => new Date(v).toLocaleString()}
          contentStyle={tooltipStyle}
          cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "3 3" }}
        />
        <Line
          type="stepAfter"
          dataKey="level"
          name="Level"
          stroke="hsl(var(--foreground))"
          strokeWidth={1.5}
          dot={{ fill: "hsl(var(--foreground))", r: 2.5, strokeWidth: 0 }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
