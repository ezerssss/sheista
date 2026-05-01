import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogOutButton } from "@/components/LogOutButton";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/training", label: "Training" },
  { href: "/history", label: "History" },
  { href: "/heatmap", label: "Heatmap" },
  { href: "/tags", label: "Tags" },
  { href: "/upsolve", label: "Upsolve" },
];

export async function NavBar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let handle: string | null = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("cf_handle").eq("id", user.id).single();
    handle = data?.cf_handle ?? null;
  }

  return (
    <header className="border-b border-border">
      <div className="container mx-auto flex flex-wrap items-center gap-4 py-4">
        <Link href={user ? "/dashboard" : "/"} className="text-lg font-bold tracking-tight">
          sheista
        </Link>
        {user && (
          <nav className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-3 text-sm">
          {user ? (
            <>
              {handle && <span className="text-muted-foreground">@{handle}</span>}
              <LogOutButton />
            </>
          ) : (
            <Link href="/auth/login" className="text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
