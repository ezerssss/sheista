"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogOutButton() {
  const router = useRouter();
  const onClick = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };
  return (
    <button
      onClick={onClick}
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      Sign out
    </button>
  );
}
