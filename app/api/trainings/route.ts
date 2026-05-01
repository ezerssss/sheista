import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { clampLevel } from "@/lib/themecp/levels";
import { fetchSolvedProblems } from "@/lib/codeforces/api";

const ProblemSchema = z.object({
  slot: z.number().int().min(1).max(4),
  contestId: z.number().int(),
  index: z.string(),
  name: z.string(),
  rating: z.number().int(),
  tags: z.array(z.string()).default([]),
  solvedAt: z.number().nullable(), // ms since epoch
});

const Body = z.object({
  level_at_start: z.number().int().min(1).max(109),
  tag_filter: z.array(z.string()).default([]),
  started_at: z.number(), // ms
  ends_at: z.number(),
  problems: z.array(ProblemSchema).length(4),
  performance: z.number().int(),
  is_ak: z.boolean(),
});

// POST /api/trainings  — finalize a completed training round.
// Writes the training, training_problems, level update, and upsolve entries in one shot.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Bad input", details: parsed.error.format() }, { status: 400 });
  }
  const body = parsed.data;

  // Upsolve gate: refuse to record a new round if the previous round's easiest
  // unsolved problem is still unsolved on Codeforces. Mirrors the client gate.
  type PrevProblem = { contest_id: number; problem_index: string; rating: number; solved_at: string | null };
  const { data: prevTrainings } = await supabase
    .from("trainings")
    .select("training_problems(contest_id, problem_index, rating, solved_at)")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(1);

  const prev = prevTrainings?.[0] as { training_problems?: PrevProblem[] } | undefined;
  const prevUnsolved: PrevProblem[] = (prev?.training_problems ?? []).filter((p) => !p.solved_at);
  if (prevUnsolved.length > 0) {
    const easiest = prevUnsolved.reduce(
      (min, p) => (p.rating < min.rating ? p : min),
      prevUnsolved[0],
    );
    const { data: profile } = await supabase
      .from("profiles")
      .select("cf_handle")
      .eq("id", user.id)
      .single();
    if (profile?.cf_handle) {
      const cfSolved = await fetchSolvedProblems(profile.cf_handle);
      const isUpsolved = cfSolved.some(
        (cf) => cf.contestId === easiest.contest_id && cf.index === easiest.problem_index,
      );
      if (!isUpsolved) {
        return NextResponse.json(
          {
            ok: false,
            error: `Upsolve ${easiest.contest_id}${easiest.problem_index} (rating ${easiest.rating}) before logging another round.`,
          },
          { status: 403 },
        );
      }
    }
  }

  const newLevel = clampLevel(body.level_at_start + (body.is_ak ? 1 : -1));

  const { data: training, error: tErr } = await supabase
    .from("trainings")
    .insert({
      user_id: user.id,
      level_at_start: body.level_at_start,
      level_at_end: newLevel,
      is_ak: body.is_ak,
      performance: body.performance,
      tag_filter: body.tag_filter,
      started_at: new Date(body.started_at).toISOString(),
      ends_at: new Date(body.ends_at).toISOString(),
    })
    .select()
    .single();

  if (tErr || !training) {
    return NextResponse.json({ ok: false, error: tErr?.message ?? "Failed to insert training" }, { status: 500 });
  }

  const { error: tpErr } = await supabase.from("training_problems").insert(
    body.problems.map((p) => ({
      training_id: training.id,
      slot: p.slot,
      contest_id: p.contestId,
      problem_index: p.index,
      problem_name: p.name,
      rating: p.rating,
      tags: p.tags,
      solved_at: p.solvedAt ? new Date(p.solvedAt).toISOString() : null,
    })),
  );
  if (tpErr) {
    // Roll back the training row to avoid orphans.
    await supabase.from("trainings").delete().eq("id", training.id);
    return NextResponse.json({ ok: false, error: tpErr.message }, { status: 500 });
  }

  await supabase.from("profiles").update({ level: newLevel, updated_at: new Date().toISOString() }).eq("id", user.id);

  // Add unsolved problems to upsolve queue (idempotent — primary key prevents dupes).
  const unsolved = body.problems.filter((p) => p.solvedAt === null);
  if (unsolved.length > 0) {
    await supabase.from("upsolve_problems").upsert(
      unsolved.map((p) => ({
        user_id: user.id,
        contest_id: p.contestId,
        problem_index: p.index,
        problem_name: p.name,
        rating: p.rating,
        tags: p.tags,
        added_at: new Date().toISOString(),
        solved_at: null,
      })),
      { onConflict: "user_id,contest_id,problem_index", ignoreDuplicates: true },
    );
  }

  return NextResponse.json({ ok: true, training_id: training.id, level: newLevel });
}

// GET /api/trainings  — recent training history with their problems.
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "100"), 500);

  const { data: trainings, error } = await supabase
    .from("trainings")
    .select("*, training_problems(*)")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, trainings });
}
