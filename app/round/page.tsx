import { redirect } from "next/navigation";
import { RoundRoom } from "@/components/RoundRoom";
import { getAuthedUser, getProfile } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function RoundPage() {
  const user = await getAuthedUser();
  if (!user) redirect("/auth/login?next=/round");

  const profile = await getProfile();
  if (!profile?.cf_handle) redirect("/");

  return <RoundRoom handle={profile.cf_handle} />;
}
