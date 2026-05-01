import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TagMasteryChart } from "@/components/TagMasteryChart";
import { createClient } from "@/lib/supabase/server";
import { computeTagStats } from "@/lib/themecp/tag-stats";
import type { TrainingRecord } from "@/types/themecp";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/tags");

  const { data } = await supabase
    .from("trainings")
    .select("id, level_at_start, level_at_end, is_ak, performance, tag_filter, started_at, ends_at, finished_at, training_problems(slot, contest_id, problem_index, rating, tags, solved_at)")
    .eq("user_id", user.id)
    .order("finished_at", { ascending: false })
    .limit(1000);

  const trainings = ((data ?? []) as unknown) as TrainingRecord[];
  const stats = computeTagStats(trainings);

  // "Weakest 3" — only consider tags with at least 3 rounds.
  const weakest = [...stats]
    .filter((s) => s.rounds >= 3 && s.tag !== "(no theme)")
    .sort((a, b) => a.akRate - b.akRate)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tag mastery</h1>

      {weakest.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Focus next on</CardTitle>
            <CardDescription>Lowest AK rate among tags with ≥3 rounds.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {weakest.map((s) => (
                <li key={s.tag}>
                  <span className="font-semibold">{s.tag}</span> — {Math.round(s.akRate * 100)}% AK over {s.rounds}{" "}
                  rounds (avg perf {s.avgPerformance})
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All tags</CardTitle>
          <CardDescription>AK rate per tag. Hover for round count and avg perf.</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tag-themed rounds yet.</p>
          ) : (
            <TagMasteryChart stats={stats} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
