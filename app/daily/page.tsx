import { redirect } from "next/navigation";
import { DailyRoom } from "@/components/DailyRoom";
import { getAuthedUser, getProfile } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function DailyPage() {
  const user = await getAuthedUser();
  if (!user) redirect("/auth/login?next=/daily");

  const profile = await getProfile();
  if (!profile?.cf_handle) redirect("/");

  return <DailyRoom handle={profile.cf_handle} level={profile.level} />;
}
