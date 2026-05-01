import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { HandleSetup } from "@/components/HandleSetup";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl">
        <section className="space-y-10 pb-16 pt-8 lg:pt-16">
          <div className="space-y-6">
            <p className="label-eyebrow">A personal themecp tracker</p>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-balance lg:text-6xl">
              Train competitive programming the way{" "}
              <a
                className="underline decoration-foreground/30 underline-offset-[6px] hover:decoration-foreground"
                href="https://codeforces.com/blog/entry/136704"
                target="_blank"
                rel="noopener noreferrer"
              >
                pwned
              </a>{" "}
              describes it.
            </h1>
            <p className="max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
              A daily four-problem mock at your level, themed on a Codeforces tag, on a self-balancing
              ladder. Streak counter, calendar heatmap, per-tag mastery, and auto-detect AK from
              your real CF submissions.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg">
              <Link href="/auth/login">Get started</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <a
                href="https://codeforces.com/blog/entry/136704"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read the ThemeCP blog →
              </a>
            </Button>
          </div>
        </section>

        <hr className="border-border" />

        <section className="grid gap-x-12 gap-y-10 py-16 sm:grid-cols-2">
          <Feature
            num="01"
            title="A self-balancing ladder"
            body="Each level maps to four ratings. AK the round → level up. Miss → step down. The system meets you where you are."
          />
          <Feature
            num="02"
            title="Auto-detect AK"
            body="We poll your real CF submissions every 30s during a round. No manual marking — finish four, the round closes itself."
          />
          <Feature
            num="03"
            title="Streak + 365-day heatmap"
            body="One green cell per day, GitHub-style. Current streak, longest, and the calendar are first-class on the dashboard."
          />
          <Feature
            num="04"
            title="Per-tag mastery"
            body="AK rate and average performance per tag. The three weakest tags surface automatically — that's where you train next."
          />
        </section>
      </div>
    );
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (profile?.cf_handle) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-md space-y-8 py-6">
      <div className="space-y-3">
        <p className="label-eyebrow">Step two of two</p>
        <h1 className="text-2xl font-semibold tracking-tight">Connect your Codeforces account</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Just your handle. We use the public CF API — no password, no login. Your starting level is
          computed from your current rating using pwned&apos;s level sheet.
        </p>
      </div>
      <HandleSetup />
    </div>
  );
}

function Feature({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs text-muted-foreground">{num}</span>
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      </div>
      <p className="pl-8 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
