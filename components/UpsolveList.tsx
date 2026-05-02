"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Check } from "lucide-react";

type Item = {
  contest_id: number;
  problem_index: string;
  problem_name: string;
  rating: number | null;
  tags: string[];
  added_at: string;
  solved_at: string | null;
};

export function UpsolveList() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/upsolve");
    const json = await res.json();
    if (json.ok) setItems(json.items);
    setLoading(false);
  };

  const refreshFromCF = async () => {
    setRefreshing(true);
    await fetch("/api/upsolve", { method: "POST" });
    await load();
    setRefreshing(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const open = items.filter((i) => !i.solved_at);
  const done = items.filter((i) => i.solved_at);

  return (
    <div className="space-y-12">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="label-eyebrow">Upsolve</p>
          <h1 className="text-3xl font-semibold tracking-tight">Failed problems</h1>
          <p className="text-sm text-muted-foreground">
            Problems you didn&apos;t solve land here. Sync with CF to mark them solved.
          </p>
        </div>
        <Button variant="outline" onClick={refreshFromCF} disabled={refreshing}>
          <RefreshCw className="h-3.5 w-3.5" />
          {refreshing ? "Checking…" : "Sync from CF"}
        </Button>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : open.length === 0 && done.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing to upsolve — failed problems land here automatically when you don&apos;t AK a round.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {open.length > 0 && (
            <Section title="Open" count={open.length}>
              {open.map((it) => (
                <ProblemRow key={`${it.contest_id}-${it.problem_index}`} it={it} />
              ))}
            </Section>
          )}
          {done.length > 0 && (
            <Section title="Solved" count={done.length}>
              {done.map((it) => (
                <ProblemRow key={`${it.contest_id}-${it.problem_index}`} it={it} />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <span className="font-mono text-xs text-muted-foreground">{count}</span>
      </div>
      <div className="overflow-hidden rounded-lg border border-border">{children}</div>
    </section>
  );
}

function ProblemRow({ it }: { it: Item }) {
  return (
    <div className="flex flex-col gap-2 border-t border-border px-5 py-4 first:border-t-0">
      <div className="flex flex-wrap items-center gap-3">
        {it.solved_at ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-accent">
            <Check className="h-3.5 w-3.5" />
          </span>
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
        )}
        {it.rating && (
          <span className="font-mono text-xs text-muted-foreground">{it.rating}</span>
        )}
        <Link
          href={`https://codeforces.com/contest/${it.contest_id}/problem/${it.problem_index}`}
          target="_blank"
          className="text-sm font-medium underline-offset-4 hover:underline"
        >
          <span className="font-mono text-muted-foreground">
            {it.contest_id}
            {it.problem_index}
          </span>{" "}
          {it.problem_name || "Problem"}
        </Link>
        {it.solved_at && <Badge variant="accent">solved</Badge>}
      </div>
      {it.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pl-6 text-[11px] text-muted-foreground">
          {it.tags.map((t) => (
            <span key={t}>#{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}
