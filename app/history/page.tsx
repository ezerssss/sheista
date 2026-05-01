import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressLineChart, LevelLineChart } from "@/components/ProgressLineChart";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
  const { data: trainings } = await supabase
    .from("trainings")
    .select("id, started_at, finished_at, performance, is_ak, level_at_start, level_at_end, tag_filter, training_problems(slot, contest_id, problem_index, problem_name, rating, solved_at)")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(200);

  const list = (trainings ?? []) as unknown as Row[];

  const chartData = [...list]
    .reverse()
    .map((t) => ({
      date: new Date(t.finished_at).getTime(),
      performance: t.performance,
      level: t.level_at_end,
    }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">History</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>Round performance over time.</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ProgressLineChart data={chartData} />
            ) : (
              <p className="text-sm text-muted-foreground">No rounds yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Level</CardTitle>
            <CardDescription>Self-balancing ladder ±1 per round.</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <LevelLineChart data={chartData} />
            ) : (
              <p className="text-sm text-muted-foreground">No rounds yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rounds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {list.length === 0 && <p className="text-sm text-muted-foreground">No rounds yet.</p>}
          {list.map((t) => (
            <div key={t.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={t.is_ak ? "default" : "secondary"}>{t.is_ak ? "AK" : "no AK"}</Badge>
                  <span className="text-sm">
                    Level {t.level_at_start} → {t.level_at_end}
                  </span>
                  <span className="text-sm text-muted-foreground">perf {t.performance}</span>
                  {t.tag_filter && t.tag_filter.length > 0 && (
                    <span className="text-xs text-muted-foreground">{t.tag_filter.join(", ")}</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{new Date(t.finished_at).toLocaleString()}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                {[...t.training_problems]
                  .sort((a, b) => a.slot - b.slot)
                  .map((p) => (
                    <Link
                      key={p.slot}
                      href={`https://codeforces.com/contest/${p.contest_id}/problem/${p.problem_index}`}
                      target="_blank"
                      className={`truncate hover:underline ${p.solved_at ? "text-green-500" : "text-muted-foreground"}`}
                      title={`${p.contest_id}${p.problem_index} ${p.problem_name}`}
                    >
                      {p.solved_at ? "✓ " : "· "}
                      {p.contest_id}
                      {p.problem_index} ({p.rating})
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
