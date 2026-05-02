import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchSolvedProblems } from "@/lib/codeforces/api";

// GET /api/upsolve  — list active upsolve items for current user.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

  const { data, error } = await supabase
    .from("upsolve_problems")
    .select("*")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, items: data });
}

// POST /api/upsolve/refresh  — reconcile upsolve items with CF solved set.
// (Implemented inline as POST on the same route for simplicity.)
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("cf_handle")
    .eq("id", user.id)
    .single();
  if (!profile?.cf_handle) return NextResponse.json({ ok: false, error: "Set CF handle first" }, { status: 400 });

  const solved = await fetchSolvedProblems(profile.cf_handle);
  const solvedKeys = new Set(solved.map((p) => `${p.contestId}_${p.index}`));

  const { data: items, error } = await supabase
    .from("upsolve_problems")
    .select("*")
    .eq("user_id", user.id)
    .is("solved_at", null);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const newlySolved = (items ?? []).filter((it) => solvedKeys.has(`${it.contest_id}_${it.problem_index}`));
  if (newlySolved.length > 0) {
    const now = new Date().toISOString();
    for (const it of newlySolved) {
      await supabase
        .from("upsolve_problems")
        .update({ solved_at: now })
        .eq("user_id", user.id)
        .eq("contest_id", it.contest_id)
        .eq("problem_index", it.problem_index);
    }
  }

  return NextResponse.json({ ok: true, marked: newlySolved.length });
}
