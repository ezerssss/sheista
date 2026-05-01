"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Point = { date: number; performance: number; level: number };

export function ProgressLineChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          type="number"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(v: number) => new Date(v).toLocaleDateString()}
          stroke="hsl(var(--muted-foreground))"
        />
        <YAxis stroke="hsl(var(--muted-foreground))" />
        <Tooltip
          labelFormatter={(v: number) => new Date(v).toLocaleString()}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            borderColor: "hsl(var(--border))",
            color: "hsl(var(--card-foreground))",
          }}
        />
        <Line
          type="monotone"
          dataKey="performance"
          name="Performance"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ fill: "hsl(var(--primary))", r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function LevelLineChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          type="number"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(v: number) => new Date(v).toLocaleDateString()}
          stroke="hsl(var(--muted-foreground))"
        />
        <YAxis stroke="hsl(var(--muted-foreground))" />
        <Tooltip
          labelFormatter={(v: number) => new Date(v).toLocaleString()}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            borderColor: "hsl(var(--border))",
            color: "hsl(var(--card-foreground))",
          }}
        />
        <Line
          type="stepAfter"
          dataKey="level"
          name="Level"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ fill: "hsl(var(--primary))", r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
