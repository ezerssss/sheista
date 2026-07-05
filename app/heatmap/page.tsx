import { redirect } from "next/navigation";
import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser, getProfile } from "@/lib/supabase/auth";
import { computeStreak } from "@/lib/themecp/streak";
import { dayKeyInTz, todayKey as computeTodayKey } from "@/lib/time/day-key";
import { StreakCard } from "@/components/StreakCard";

export const dynamic = "force-dynamic";

export default async function HeatmapPage() {
  const user = await getAuthedUser();
  if (!user) redirect("/auth/login?next=/heatmap");

  const profile = await getProfile();
  const timezone = profile?.timezone ?? "UTC";
  const todayKey = computeTodayKey(timezone);

  const supabase = await createClient();
  // The visible heatmap window is ±182 days = 365 days. Pulling 2000 rows was
  // gratuitous; cap at 730 (2 years) so streak history past the visible window
  // is still respected without bloating the response.
  const { data: trainings } = await supabase
    .from("trainings")
    .select("finished_at, is_ak")
    .eq("user_id", user.id)
    .order("finished_at", { ascending: false })
    .limit(730);

  const counts = new Map<string, number>();
  for (const t of trainings ?? []) {
    const k = dayKeyInTz(new Date(t.finished_at), timezone);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const values = Array.from(counts.entries()).map(([date, count]) => ({ date, count }));

  const today = new Date();
  const start365 = new Date(today);
  start365.setDate(start365.getDate() - 182);
  const end365 = new Date(today);
  end365.setDate(end365.getDate() + 182);

  const streak = computeStreak(
    (trainings ?? []).map((t) => t.finished_at),
    timezone,
  );

  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <p className="label-eyebrow">Heatmap</p>
        <h1 className="text-3xl font-semibold tracking-tight">A year of rounds</h1>
        <p className="text-sm text-muted-foreground">
          Each cell is one day. Darker means more rounds finished that day.
        </p>
      </header>

      <section className="grid divide-y divide-border rounded-lg border border-border md:grid-cols-3 md:divide-x md:divide-y-0">
        <div className="p-6">
          <StreakCard
            current={streak.current}
            longest={streak.longest}
            todayDone={streak.todayDone}
          />
        </div>
        <div className="space-y-4 p-6">
          <p className="label-eyebrow">Active days</p>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-5xl font-light tabular-nums tracking-tightest">
              {counts.size}
            </span>
            <span className="text-xs text-muted-foreground">days</span>
          </div>
          <p className="text-xs text-muted-foreground">days with at least one round</p>
        </div>
        <div className="space-y-4 p-6">
          <p className="label-eyebrow">Total rounds</p>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-5xl font-light tabular-nums tracking-tightest">
              {trainings?.length ?? 0}
            </span>
            <span className="text-xs text-muted-foreground">finished</span>
          </div>
          <p className="text-xs text-muted-foreground">all-time</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold tracking-tight">A year around today</h2>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>less</span>
            <span className="flex gap-0.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[hsl(0_0%_95%)]" />
              <span className="h-2.5 w-2.5 rounded-sm bg-[#9be9a8]" />
              <span className="h-2.5 w-2.5 rounded-sm bg-[#40c463]" />
              <span className="h-2.5 w-2.5 rounded-sm bg-[#30a14e]" />
              <span className="h-2.5 w-2.5 rounded-sm bg-[#216e39]" />
            </span>
            <span>more</span>
          </p>
        </div>
        <div className="rounded-lg border border-border p-6">
          <CalendarHeatmap
            values={values}
            startDate={start365}
            endDate={end365}
            todayKey={todayKey}
          />
        </div>
      </section>
    </div>
  );
}
