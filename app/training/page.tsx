import { redirect } from "next/navigation";
import { Trainer } from "@/components/Trainer";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/training");

  const { data: profile } = await supabase
    .from("profiles")
    .select("cf_handle, level")
    .eq("id", user.id)
    .single();

  if (!profile?.cf_handle) redirect("/");

  return <Trainer handle={profile.cf_handle} level={profile.level} />;
}
