"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
    <Button variant="ghost" size="sm" onClick={onClick}>
      Log out
    </Button>
  );
}
