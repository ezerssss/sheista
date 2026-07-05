import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

  const { data: trainings, error } = await supabase
    .from("trainings")
    .select(
      "id, started_at, finished_at, is_ak, training_problems(slot, contest_id, problem_index, problem_name, rating, solved_at)",
    )
    .eq("user_id", user.id)
    .order("finished_at", { ascending: false })
    .limit(1);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, training: trainings?.[0] ?? null });
}
