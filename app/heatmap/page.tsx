import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { createClient } from "@/lib/supabase/server";
import { computeStreak } from "@/lib/themecp/streak";
import { StreakCard } from "@/components/StreakCard";

export const dynamic = "force-dynamic";

const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default async function HeatmapPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/heatmap");

  const { data: trainings } = await supabase
    .from("trainings")
    .select("finished_at, is_ak")
    .eq("user_id", user.id)
    .order("finished_at", { ascending: false })
    .limit(2000);

  const counts = new Map<string, number>();
  for (const t of trainings ?? []) {
    const k = fmt(new Date(t.finished_at));
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const values = Array.from(counts.entries()).map(([date, count]) => ({ date, count }));

  const today = new Date();
  const start365 = new Date(today);
  start365.setDate(start365.getDate() - 364);

  const streak = computeStreak((trainings ?? []).map((t) => t.finished_at));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Heatmap</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <StreakCard current={streak.current} longest={streak.longest} todayDone={streak.todayDone} />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{counts.size}</div>
            <p className="text-xs text-muted-foreground">days with at least one round</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total rounds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{trainings?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">finished, all-time</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Last 365 days</CardTitle>
          <CardDescription>Darker = more rounds that day.</CardDescription>
        </CardHeader>
        <CardContent>
          <CalendarHeatmap values={values} startDate={start365} endDate={today} />
        </CardContent>
      </Card>
    </div>
  );
}
