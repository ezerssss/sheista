import { notFound, redirect } from "next/navigation";
import { RoundView, type RoundViewTraining } from "@/components/RoundView";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PastRoundPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/round/${id}`);

  const [{ data: training }, { data: upsolved }] = await Promise.all([
    supabase
      .from("trainings")
      .select(
        "id, started_at, ends_at, finished_at, performance, is_ak, level_at_start, level_at_end, tag_filter, training_problems(slot, contest_id, problem_index, problem_name, rating, tags, solved_at)",
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("upsolve_problems")
      .select("contest_id, problem_index")
      .eq("user_id", user.id)
      .not("solved_at", "is", null),
  ]);

  if (!training) notFound();
  const upsolvedSet = new Set(
    (upsolved ?? []).map((u) => `${u.contest_id}_${u.problem_index}`),
  );

  return (
    <RoundView
      training={training as unknown as RoundViewTraining}
      upsolvedSet={upsolvedSet}
    />
  );
}
