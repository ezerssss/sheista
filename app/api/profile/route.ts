import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { fetchUser } from "@/lib/codeforces/api";
import { getLevelByRating } from "@/lib/themecp/levels";
import { isValidTimeZone } from "@/lib/time/day-key";

const Body = z.object({
  cf_handle: z.string().min(1).max(50),
});

const PatchBody = z.object({
  timezone: z.string().min(1).max(64),
});

// PATCH /api/profile — update the stored IANA timezone (from TimezoneSync).
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

  const parsed = PatchBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Bad input" }, { status: 400 });

  const timezone = parsed.data.timezone;
  if (!isValidTimeZone(timezone)) {
    return NextResponse.json({ ok: false, error: "Invalid timezone" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ timezone, updated_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, timezone });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Bad input" }, { status: 400 });

  const handle = parsed.data.cf_handle.trim();
  const cfUser = await fetchUser(handle);
  if (!cfUser) {
    return NextResponse.json({ ok: false, error: "Codeforces handle not found" }, { status: 404 });
  }

  const startingLevel = Number(getLevelByRating(cfUser.rating ?? null).level);

  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        cf_handle: cfUser.handle,
        cf_rating: cfUser.rating ?? null,
        cf_avatar: cfUser.titlePhoto ?? cfUser.avatar ?? null,
        level: startingLevel,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    profile: {
      cf_handle: cfUser.handle,
      cf_rating: cfUser.rating ?? null,
      cf_avatar: cfUser.titlePhoto ?? cfUser.avatar ?? null,
      level: startingLevel,
    },
  });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, profile: data });
}
