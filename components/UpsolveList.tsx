"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, X } from "lucide-react";

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

  const remove = async (it: Item) => {
    await fetch(`/api/upsolve?contestId=${it.contest_id}&index=${encodeURIComponent(it.problem_index)}`, {
      method: "DELETE",
    });
    setItems((prev) => prev.filter((p) => p.contest_id !== it.contest_id || p.problem_index !== it.problem_index));
  };

  useEffect(() => {
    void load();
  }, []);

  const open = items.filter((i) => !i.solved_at);
  const done = items.filter((i) => i.solved_at);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Upsolve queue</h2>
        <Button variant="outline" size="sm" onClick={refreshFromCF} disabled={refreshing}>
          <RefreshCw className="h-4 w-4" /> {refreshing ? "Checking…" : "Sync from CF"}
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : open.length === 0 && done.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing to upsolve — failed problems land here automatically when you don&apos;t AK a round.
        </p>
      ) : (
        <>
          {open.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{open.length} open</h3>
              {open.map((it) => (
                <ProblemRow key={`${it.contest_id}-${it.problem_index}`} it={it} onRemove={remove} />
              ))}
            </section>
          )}
          {done.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{done.length} solved</h3>
              {done.map((it) => (
                <ProblemRow key={`${it.contest_id}-${it.problem_index}`} it={it} onRemove={remove} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ProblemRow({ it, onRemove }: { it: Item; onRemove: (it: Item) => void }) {
  return (
    <div className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {it.rating && <Badge variant="outline">{it.rating}</Badge>}
          <Link
            href={`https://codeforces.com/contest/${it.contest_id}/problem/${it.problem_index}`}
            target="_blank"
            className="text-sm font-medium text-primary hover:underline"
          >
            {it.contest_id}{it.problem_index} · {it.problem_name || "Problem"}
          </Link>
          {it.solved_at && <Badge>solved</Badge>}
        </div>
        <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
          {it.tags.map((t) => (
            <span key={t} className="rounded bg-secondary px-1.5 py-0.5">
              {t}
            </span>
          ))}
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={() => onRemove(it)}>
        <X className="h-4 w-4" /> Remove
      </Button>
    </div>
  );
}
