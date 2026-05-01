import { redirect } from "next/navigation";
import { RoundRoom } from "@/components/RoundRoom";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RoundPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/round");

  const { data: profile } = await supabase
    .from("profiles")
    .select("cf_handle")
    .eq("id", user.id)
    .single();

  if (!profile?.cf_handle) redirect("/");

  return <RoundRoom handle={profile.cf_handle} />;
}
