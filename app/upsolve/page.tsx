import { redirect } from "next/navigation";
import { UpsolveList } from "@/components/UpsolveList";
import { getAuthedUser } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function UpsolvePage() {
  const user = await getAuthedUser();
  if (!user) redirect("/auth/login?next=/upsolve");
  return <UpsolveList />;
}
