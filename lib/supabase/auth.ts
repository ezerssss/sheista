import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// React `cache()` dedupes these calls within a single render. Multiple server
// components — middleware-already-validated layout, NavBar, the page itself,
// helpers like getUserStats — all share the same getUser/profile fetches
// instead of each issuing their own round-trip to Supabase.

export const getAuthedUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getProfile = cache(async () => {
  const user = await getAuthedUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, cf_handle, cf_rating, cf_avatar, level, updated_at")
    .eq("id", user.id)
    .single();
  return data;
});
