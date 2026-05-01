import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LevelDisplay } from "@/components/LevelDisplay";
import { StreakCard } from "@/components/StreakCard";
import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { createClient } from "@/lib/supabase/server";
import { computeStreak } from "@/lib/themecp/streak";

export const dynamic = "force-dynamic";

function formatDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.cf_handle) redirect("/");

  const { data: trainings } = await supabase
    .from("trainings")
    .select("started_at, finished_at, performance, is_ak, level_at_start, level_at_end")
    .eq("user_id", user.id)
    .order("finished_at", { ascending: false })
    .limit(365);

  const finishedAtList = (trainings ?? []).map((t) => t.finished_at);
  const streak = computeStreak(finishedAtList);

  // Heatmap data — 90 days back from today.
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 89);
  const counts = new Map<string, number>();
  for (const t of trainings ?? []) {
    const k = formatDay(new Date(t.finished_at));
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const values = Array.from(counts.entries()).map(([date, count]) => ({ date, count }));

  const totalAk = (trainings ?? []).filter((t) => t.is_ak).length;
  const totalRounds = trainings?.length ?? 0;
  const akRate = totalRounds === 0 ? 0 : Math.round((totalAk / totalRounds) * 100);
  const recentPerf = trainings?.slice(0, 10).reverse().map((t) => t.performance) ?? [];
  const avgRecentPerf =
    recentPerf.length === 0 ? 0 : Math.round(recentPerf.reduce((a, b) => a + b, 0) / recentPerf.length);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {profile.cf_handle}</h1>
          <p className="text-sm text-muted-foreground">
            CF rating {profile.cf_rating ?? "unrated"} · {totalRounds} rounds · {akRate}% AK · avg perf last 10:{" "}
            {avgRecentPerf || "—"}
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/training">{streak.todayDone ? "Do another round" : "Start today's round"}</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <LevelDisplay level={profile.level} />
        <StreakCard current={streak.current} longest={streak.longest} todayDone={streak.todayDone} />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalRounds}</div>
            <p className="text-xs text-muted-foreground">total rounds — {totalAk} AK</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Last 90 days</CardTitle>
          <CardDescription>Each cell is one day; intensity grows with the number of rounds finished.</CardDescription>
        </CardHeader>
        <CardContent>
          <CalendarHeatmap values={values} startDate={start} endDate={today} />
        </CardContent>
      </Card>
    </div>
  );
}
