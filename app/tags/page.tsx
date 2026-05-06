import { redirect } from "next/navigation";
import { TagMasteryChart } from "@/components/TagMasteryChart";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { computeTagStats } from "@/lib/themecp/tag-stats";
import type { TrainingRecord } from "@/types/themecp";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const user = await getAuthedUser();
  if (!user) redirect("/auth/login?next=/tags");

  const supabase = await createClient();
  const { data } = await supabase
    .from("trainings")
    .select("id, level_at_start, level_at_end, is_ak, performance, tag_filter, started_at, ends_at, finished_at, training_problems(slot, contest_id, problem_index, rating, tags, solved_at)")
    .eq("user_id", user.id)
    .order("finished_at", { ascending: false })
    .limit(500);

  const trainings = ((data ?? []) as unknown) as TrainingRecord[];
  const stats = computeTagStats(trainings);

  const weakest = [...stats]
    .filter((s) => s.rounds >= 3 && s.tag !== "(no theme)")
    .sort((a, b) => a.akRate - b.akRate)
    .slice(0, 3);

  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <p className="label-eyebrow">Tags</p>
        <h1 className="text-3xl font-semibold tracking-tight">Per-tag mastery</h1>
        <p className="text-sm text-muted-foreground">
          AK rate per Codeforces tag. The system surfaces your three weakest tags below.
        </p>
      </header>

      {weakest.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-semibold tracking-tight">Focus next on</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {weakest.map((s, i) => (
              <div
                key={s.tag}
                className="rounded-lg border border-border p-5"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {s.rounds} rounds
                  </span>
                </div>
                <h3 className="mt-2 truncate text-base font-semibold tracking-tight">
                  {s.tag}
                </h3>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-light tabular-nums tracking-tightest text-destructive">
                    {Math.round(s.akRate * 100)}%
                  </span>
                  <span className="text-xs text-muted-foreground">AK</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  avg perf{" "}
                  <span className="font-mono text-foreground">{s.avgPerformance}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold tracking-tight">All tags</h2>
          <p className="flex items-center gap-3 text-xs text-muted-foreground">
            <Legend swatch="hsl(0 65% 50%)" label="<33%" />
            <Legend swatch="hsl(38 80% 50%)" label="33–66%" />
            <Legend swatch="hsl(142 55% 36%)" label="≥66%" />
          </p>
        </div>
        <div className="rounded-lg border border-border p-6">
          {stats.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No tag-themed rounds yet.
            </p>
          ) : (
            <TagMasteryChart stats={stats} />
          )}
        </div>
      </section>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: swatch }} />
      <span>{label}</span>
    </span>
  );
}
