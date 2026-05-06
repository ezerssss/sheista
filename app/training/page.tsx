import { redirect } from "next/navigation";
import { Trainer } from "@/components/Trainer";
import { getAuthedUser, getProfile } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  const user = await getAuthedUser();
  if (!user) redirect("/auth/login?next=/training");

  const profile = await getProfile();
  if (!profile?.cf_handle) redirect("/");

  return <Trainer handle={profile.cf_handle} level={profile.level} />;
}
