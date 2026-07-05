import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dayKeyInTz, todayKey as computeTodayKey } from "@/lib/time/day-key";

const Body = z.object({
  contest_id: z.number().int(),
  problem_index: z.string().min(1).max(8),
  problem_name: z.string().default(""),
  rating: z.number().int().nullable().default(null),
  tags: z.array(z.string()).default([]),
  source: z.enum(["upsolve", "weak-tag", "random"]),
  started_at: z.number(), // ms since epoch
  solved_at: z.number(), // ms since epoch — the CF submission time
});

// POST /api/daily — record today's daily bite. Idempotent: the table's
// primary key (user_id, day_key) allows at most one bite per local day, so
// double-fired polling, retry-on-mount, and second-bite-same-day all collapse
// into { deduped: true }.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Bad input", details: parsed.error.format() }, { status: 400 });
  }
  const body = parsed.data;

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();
  // Server-authoritative day key — never trust a client-computed one.
  const timezone = profile?.timezone ?? "UTC";
  const day_key = dayKeyInTz(new Date(body.solved_at), timezone);

  const { data: inserted, error } = await supabase
    .from("daily_solves")
    .upsert(
      {
        user_id: user.id,
        day_key,
        contest_id: body.contest_id,
        problem_index: body.problem_index,
        problem_name: body.problem_name,
        rating: body.rating,
        tags: body.tags,
        source: body.source,
        started_at: new Date(body.started_at).toISOString(),
        solved_at: new Date(body.solved_at).toISOString(),
      },
      { onConflict: "user_id,day_key", ignoreDuplicates: true },
    )
    .select();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  const deduped = !inserted || inserted.length === 0;

  // If the bite was (or matches) an upsolve-queue item, mark it solved with
  // the real CF solve time so the heatmap day is right.
  await supabase
    .from("upsolve_problems")
    .update({ solved_at: new Date(body.solved_at).toISOString() })
    .eq("user_id", user.id)
    .eq("contest_id", body.contest_id)
    .eq("problem_index", body.problem_index)
    .is("solved_at", null);

  return NextResponse.json({ ok: true, day_key, deduped });
}

// GET /api/daily — today's bite, if already recorded.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();
  const day_key = computeTodayKey(profile?.timezone ?? "UTC");

  const { data, error } = await supabase
    .from("daily_solves")
    .select("*")
    .eq("user_id", user.id)
    .eq("day_key", day_key)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, today: data ?? null });
}
