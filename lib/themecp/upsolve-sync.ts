import { fetchSolvedProblemsWithTimes } from "@/lib/codeforces/api";
import type { createClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Reconcile the user's upsolve queue with their Codeforces solved set.
 * Newly-solved items get solved_at = the earliest OK submission time on CF
 * (not "now"), so streak/heatmap day-buckets reflect when the solve happened.
 * Returns how many items were marked solved.
 */
export async function syncUpsolveFromCf(
  supabase: ServerSupabase,
  userId: string,
  handle: string,
): Promise<number> {
  const solvedTimes = await fetchSolvedProblemsWithTimes(handle);

  const { data: items, error } = await supabase
    .from("upsolve_problems")
    .select("contest_id, problem_index")
    .eq("user_id", userId)
    .is("solved_at", null);
  if (error) throw new Error(error.message);

  let marked = 0;
  for (const it of items ?? []) {
    const t = solvedTimes.get(`${it.contest_id}_${it.problem_index}`);
    if (t === undefined) continue;
    await supabase
      .from("upsolve_problems")
      .update({ solved_at: new Date(t).toISOString() })
      .eq("user_id", userId)
      .eq("contest_id", it.contest_id)
      .eq("problem_index", it.problem_index);
    marked += 1;
  }
  return marked;
}
