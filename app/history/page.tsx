import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ProgressLineChart, LevelLineChart } from "@/components/ProgressLineChart";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await getAuthedUser();
  if (!user) redirect("/auth/login?next=/history");

  type Row = {
    id: string;
    started_at: string;
    finished_at: string;
    performance: number;
    is_ak: boolean;
    level_at_start: number;
    level_at_end: number;
    tag_filter: string[];
    training_problems: {
      slot: number;
      contest_id: number;
      problem_index: string;
      problem_name: string;
      rating: number;
      solved_at: string | null;
    }[];
  };
  const supabase = await createClient();
  const [trainingsRes, upsolvedRes] = await Promise.all([
    supabase
      .from("trainings")
      .select("id, started_at, finished_at, performance, is_ak, level_at_start, level_at_end, tag_filter, training_problems(slot, contest_id, problem_index, problem_name, rating, solved_at)")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(100),
    supabase
      .from("upsolve_problems")
      .select("contest_id, problem_index")
      .eq("user_id", user.id)
      .not("solved_at", "is", null),
  ]);

  const list = (trainingsRes.data ?? []) as unknown as Row[];
  const upsolvedSet = new Set(
    (upsolvedRes.data ?? []).map((u) => `${u.contest_id}_${u.problem_index}`),
  );

  const chartData = [...list]
    .reverse()
    .map((t) => ({
      date: new Date(t.finished_at).getTime(),
      performance: t.performance,
      level: t.level_at_end,
    }));

  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <p className="label-eyebrow">History</p>
        <h1 className="text-3xl font-semibold tracking-tight">Rounds &amp; progress</h1>
        <p className="text-sm text-muted-foreground">
          {list.length} round{list.length === 1 ? "" : "s"} · the ladder shifts ±1 per round.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <ChartCard
          title="Performance"
          subtitle="Per-round perf over time"
          empty={chartData.length === 0}
        >
          <ProgressLineChart data={chartData} />
        </ChartCard>
        <ChartCard
          title="Level"
          subtitle="Self-balancing ladder"
          empty={chartData.length === 0}
        >
          <LevelLineChart data={chartData} />
        </ChartCard>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-base font-semibold tracking-tight">All rounds</h2>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <LegendItem dotClass="bg-accent" label="solved" />
            <LegendItem dotClass="bg-amber-500" label="upsolved" />
            <LegendItem dotClass="bg-muted-foreground/40" label="unsolved" />
          </div>
        </div>
        {list.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">No rounds yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            {list.map((t, idx) => (
              <div
                key={t.id}
                className={`px-5 py-4 ${idx > 0 ? "border-t border-border" : ""}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <Badge variant={t.is_ak ? "accent" : "muted"}>
                      {t.is_ak ? "AK" : "no AK"}
                    </Badge>
                    <span className="text-sm">
                      Level{" "}
                      <span className="font-mono">{t.level_at_start}</span>
                      <span className="mx-1 text-muted-foreground">→</span>
                      <span className="font-mono">{t.level_at_end}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      perf <span className="font-mono text-foreground">{t.performance}</span>
                    </span>
                    {t.tag_filter && t.tag_filter.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {t.tag_filter.map((tag) => `#${tag}`).join(" ")}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {new Date(t.finished_at).toLocaleString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  {[...t.training_problems]
                    .sort((a, b) => a.slot - b.slot)
                    .map((p) => {
                      const isUpsolved =
                        !p.solved_at &&
                        upsolvedSet.has(`${p.contest_id}_${p.problem_index}`);
                      const status = p.solved_at
                        ? "solved in round"
                        : isUpsolved
                          ? "upsolved later"
                          : "not solved";
                      return (
                        <Link
                          key={p.slot}
                          href={`https://codeforces.com/contest/${p.contest_id}/problem/${p.problem_index}`}
                          target="_blank"
                          className={`flex min-w-0 items-center gap-1.5 truncate text-xs hover:underline ${
                            p.solved_at
                              ? "text-accent"
                              : isUpsolved
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-muted-foreground"
                          }`}
                          title={`${p.contest_id}${p.problem_index} ${p.problem_name} — ${status}`}
                        >
                          <span
                            className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                              p.solved_at
                                ? "bg-accent"
                                : isUpsolved
                                  ? "bg-amber-500"
                                  : "bg-muted-foreground/40"
                            }`}
                          />
                          <span className="font-mono">
                            {p.contest_id}
                            {p.problem_index}
                          </span>
                          <span className="text-muted-foreground">({p.rating})</span>
                        </Link>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function LegendItem({ dotClass, label }: { dotClass: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}

function ChartCard({
  title,
  subtitle,
  empty,
  children,
}: {
  title: string;
  subtitle: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-border p-6">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {empty ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No rounds yet.</p>
      ) : (
        children
      )}
    </div>
  );
}
