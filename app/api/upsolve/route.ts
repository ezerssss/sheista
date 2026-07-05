import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncUpsolveFromCf } from "@/lib/themecp/upsolve-sync";

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

  try {
    const marked = await syncUpsolveFromCf(supabase, user.id, profile.cf_handle);
    return NextResponse.json({ ok: true, marked });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
