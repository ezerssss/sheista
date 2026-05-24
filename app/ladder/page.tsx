import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/auth";
import { LadderHero } from "@/components/ladder/LadderHero";
import { TierRail } from "@/components/ladder/TierRail";
import { LadderList } from "@/components/ladder/LadderList";
import { LadderScrollIntoView } from "@/components/ladder/LadderScrollIntoView";

export const dynamic = "force-dynamic";

export default async function LadderPage() {
  const profile = await getProfile();
  if (!profile) redirect("/auth/login?next=/ladder");

  const currentLevel = profile.level ?? 1;

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="label-eyebrow">Ladder</p>
        <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
          The climb
        </h1>
        <p className="text-sm text-muted-foreground">
          All 109 levels grouped into Codeforces-style tiers. Your current rung
          is highlighted — cross a tier boundary to unlock the next color.
        </p>
      </header>

      <LadderHero currentLevel={currentLevel} />
      <TierRail currentLevel={currentLevel} />
      <LadderList currentLevel={currentLevel} />
      <LadderScrollIntoView />
    </div>
  );
}
