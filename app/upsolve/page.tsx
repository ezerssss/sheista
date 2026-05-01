import { redirect } from "next/navigation";
import { UpsolveList } from "@/components/UpsolveList";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function UpsolvePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/upsolve");
  return <UpsolveList />;
}
