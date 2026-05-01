import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { HandleSetup } from "@/components/HandleSetup";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">sheista</CardTitle>
            <CardDescription className="text-base">
              A personal ThemeCP tracker — train competitive programming the way{" "}
              <a className="text-primary hover:underline" href="https://codeforces.com/blog/entry/136704" target="_blank" rel="noopener noreferrer">
                pwned
              </a>{" "}
              describes it. Daily 4-problem mocks at your level, themed on a Codeforces tag, with a self-balancing
              ladder. Streak counter, GitHub-style heatmap, per-tag mastery, and auto-detect AK from your real CF
              submissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/auth/login">Get started</Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://codeforces.com/blog/entry/136704" target="_blank" rel="noopener noreferrer">
                Read the ThemeCP blog
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (profile?.cf_handle) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Connect your Codeforces account</CardTitle>
          <CardDescription>
            Just your handle. We use the public CF API — no password, no login. Your starting level is computed from
            your current rating using pwned&apos;s level sheet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HandleSetup />
        </CardContent>
      </Card>
    </div>
  );
}
