import { redirect } from "next/navigation";
import Link from "next/link";
import { LevelDisplay } from "@/components/LevelDisplay";
import { StreakCard } from "@/components/StreakCard";
import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { SmartCTA } from "@/components/SmartCTA";
import { ShareButton } from "@/components/share/ShareButton";
import { getUserStats } from "@/lib/themecp/user-stats";

export const dynamic = "force-dynamic";

function formatDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function DashboardPage() {
  const stats = await getUserStats();
  if (!stats) redirect("/auth/login?next=/dashboard");

  const {
    profile,
    trainings,
    streak,
    totalRounds,
    totalAk,
    akRate,
    avgRecentPerf,
    gateCandidates,
    weakestTag,
  } = stats;

  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 182);
  const end = new Date(today);
  end.setDate(end.getDate() + 182);
  const counts = new Map<string, number>();
  for (const t of trainings) {
    const k = formatDay(new Date(t.finished_at));
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const values = Array.from(counts.entries()).map(([date, count]) => ({ date, count }));

  return (
    <div className="space-y-12">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <p className="label-eyebrow">Dashboard</p>
          <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
            Welcome back, <span className="text-muted-foreground">@</span>
            {profile.cf_handle}
          </h1>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <Stat label="cf rating" value={profile.cf_rating ?? "unrated"} />
            <Sep />
            <Stat label="rounds" value={totalRounds} />
            <Sep />
            <Stat label="AK rate" value={`${akRate}%`} />
            <Sep />
            <Stat label="avg perf (10)" value={avgRecentPerf || "—"} />
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SmartCTA
            handle={profile.cf_handle}
            level={profile.level}
            gateCandidates={gateCandidates}
            todayDone={streak.todayDone}
            weakestTag={weakestTag}
          />
          <ShareButton
            cfHandle={profile.cf_handle}
            cfRating={profile.cf_rating}
            level={profile.level}
            streakCurrent={streak.current}
            streakLongest={streak.longest}
            todayDone={streak.todayDone}
            akRate={akRate}
            totalRounds={totalRounds}
            heatmap={values}
          />
        </div>
      </header>

      <section className="grid divide-y divide-border rounded-lg border border-border md:grid-cols-3 md:divide-x md:divide-y-0">
        <Link
          href="/ladder"
          className="block p-6 transition-colors hover:bg-muted/30"
        >
          <LevelDisplay level={profile.level} />
        </Link>
        <div className="p-6">
          <StreakCard
            current={streak.current}
            longest={streak.longest}
            todayDone={streak.todayDone}
          />
        </div>
        <div className="p-6">
          <RoundsStat total={totalRounds} ak={totalAk} avgPerf={avgRecentPerf} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold tracking-tight">Activity</h2>
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
          <CalendarHeatmap values={values} startDate={start} endDate={end} />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-sm font-medium text-foreground">{value}</span>
    </span>
  );
}

function Sep() {
  return <span className="text-border">·</span>;
}

function RoundsStat({ total, ak, avgPerf }: { total: number; ak: number; avgPerf: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="label-eyebrow">Rounds</p>
        <span className="font-mono text-[10px] text-muted-foreground">all time</span>
      </div>
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-5xl font-light tabular-nums tracking-tightest">
          {total}
        </span>
        <span className="text-xs text-muted-foreground">finished</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          <span className="font-mono text-foreground">{ak}</span> AK
        </span>
        <span className="text-border">·</span>
        <span>
          avg perf <span className="font-mono text-foreground">{avgPerf || "—"}</span>
        </span>
      </div>
    </div>
  );
}
