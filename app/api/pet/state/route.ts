import { NextResponse } from "next/server";
import { getUserStats } from "@/lib/themecp/user-stats";
import type { PetStatePayload } from "@/lib/pet/types";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse<PetStatePayload>> {
  const stats = await getUserStats();
  if (!stats) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({
    authenticated: true,
    cf_handle: stats.profile.cf_handle,
    cf_rating: stats.profile.cf_rating,
    level: stats.profile.level,
    streak: {
      current: stats.streak.current,
      longest: stats.streak.longest,
      todayDone: stats.streak.todayDone,
    },
    totalRounds: stats.totalRounds,
    akRate: stats.akRate,
    avgRecentPerf: stats.avgRecentPerf,
    lastFinishedAt: stats.lastFinishedAt,
    gateBlocked: stats.gateBlocked,
    recentHeatmap: stats.recentHeatmap,
    todayKey: stats.todayKey,
  });
}
