import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogOutButton } from "@/components/LogOutButton";

const NAV = [
  { href: "/dashboard", label: "dashboard" },
  { href: "/training", label: "training" },
  { href: "/history", label: "history" },
  { href: "/heatmap", label: "heatmap" },
  { href: "/tags", label: "tags" },
  { href: "/upsolve", label: "upsolve" },
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
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      <div className="container mx-auto flex flex-wrap items-center gap-x-8 gap-y-3 px-6 py-4">
        <Link
          href={user ? "/dashboard" : "/"}
          className="group flex items-baseline gap-2"
        >
          <span className="text-base font-semibold tracking-tight text-foreground">
            sheista
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:inline">
            themecp
          </span>
        </Link>

        {user && (
          <nav className="-mx-2 flex flex-wrap items-center text-sm text-muted-foreground">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-2 py-1 transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-3 text-sm">
          {user ? (
            <>
              {handle && (
                <span className="font-mono text-xs text-muted-foreground">
                  <span className="text-border">@</span>
                  {handle}
                </span>
              )}
              <LogOutButton />
            </>
          ) : (
            <Link
              href="/auth/login"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
