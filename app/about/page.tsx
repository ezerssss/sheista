import Link from "next/link";

export const metadata = {
  title: "About — sheista",
  description: "Credits and inspiration for sheista.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-14 py-6">
      <header className="space-y-3">
        <p className="label-eyebrow">About</p>
        <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
          Credits &amp; inspiration
        </h1>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          sheista wouldn&apos;t exist without the people below. The method, the data, and the
          reference implementation all come from elsewhere — this app just wraps it in a tracker
          that uses your real Codeforces submissions.
        </p>
      </header>

      <Credit
        num="01"
        label="The method"
        title="ThemeCP, by pwned"
        href="https://codeforces.com/blog/entry/136704"
      >
        Every part of how sheista picks problems and adjusts your level is faithful to the system{" "}
        <Ext href="https://codeforces.com/profile/pwned">pwned</Ext> describes in their{" "}
        <Ext href="https://codeforces.com/blog/entry/136704">Codeforces blog post</Ext>. The
        109-row level sheet, the 35 official tags, the four-problem mocks, the ±1 self-balancing
        ladder — all theirs. sheista is, at its core, just a faithful client for that idea.
      </Credit>

      <Credit
        num="02"
        label="Reference implementation"
        title="Training-Tracker, by C0ldSmi1e"
        href="https://github.com/C0ldSmi1e/training-tracker"
      >
        The data files that drive sheista — <code className="font-mono text-foreground">level.json</code>,{" "}
        <code className="font-mono text-foreground">tag.json</code>, the contest-exclusion list — and
        the Excel-style performance formula are sourced from{" "}
        <Ext href="https://github.com/C0ldSmi1e/training-tracker">
          C0ldSmi1e/Training-Tracker
        </Ext>
        , which itself mirrors pwned&apos;s spreadsheet. If you want the original web version of this
        idea, that&apos;s where to look.
      </Credit>

      <Credit
        num="03"
        label="Data"
        title="Codeforces public API"
        href="https://codeforces.com/apiHelp"
      >
        Every problem, submission, and rating you see in sheista comes from{" "}
        <Ext href="https://codeforces.com/apiHelp">codeforces.com/apiHelp</Ext>. We never ask for
        your password — only your handle. Submissions are polled at most every 30 seconds during a
        round so AK is detected without any manual marking.
      </Credit>

      <Credit
        num="04"
        label="The chicken"
        title="Inspired by Stardew Valley, by ConcernedApe"
        href="https://www.stardewvalley.net/"
      >
        The little chicken that follows you around the app is a love letter to the coops in{" "}
        <Ext href="https://www.stardewvalley.net/">Stardew Valley</Ext> by{" "}
        <Ext href="https://twitter.com/ConcernedApe">ConcernedApe</Ext>. The pixel art here is
        original to sheista (no SDV assets are used) — it just borrows the vibe. If you haven&apos;t
        played Stardew, go do that instead of another round, honestly.
      </Credit>

      <Credit num="05" label="Built with">
        <ul className="space-y-1.5 font-mono text-[13px]">
          <li>
            <span className="text-muted-foreground">framework</span>{" "}
            <Ext href="https://nextjs.org">Next.js 15</Ext> ·{" "}
            <Ext href="https://react.dev">React 19</Ext>
          </li>
          <li>
            <span className="text-muted-foreground">styling</span>{" "}
            <Ext href="https://tailwindcss.com">Tailwind CSS</Ext> ·{" "}
            <Ext href="https://ui.shadcn.com">shadcn/ui</Ext>
          </li>
          <li>
            <span className="text-muted-foreground">backend</span>{" "}
            <Ext href="https://supabase.com">Supabase</Ext> (Postgres + magic-link auth)
          </li>
          <li>
            <span className="text-muted-foreground">ui bits</span>{" "}
            <Ext href="https://swr.vercel.app">SWR</Ext> ·{" "}
            <Ext href="https://recharts.org">Recharts</Ext> ·{" "}
            <Ext href="https://github.com/kevinsqi/react-calendar-heatmap">
              react-calendar-heatmap
            </Ext>{" "}
            ·{" "}
            <Ext href="https://lucide.dev">Lucide</Ext>
          </li>
        </ul>
      </Credit>

      <hr className="border-border" />

      <section className="space-y-3">
        <p className="label-eyebrow">A note</p>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          sheista is a personal project, not affiliated with Codeforces, pwned, or C0ldSmi1e. If
          you&apos;re any of those people and want a credit changed (or removed), open an issue and
          it&apos;s done. Otherwise — go solve four problems.
        </p>
        <div className="pt-2">
          <Link
            href="/training"
            className="text-sm text-foreground underline decoration-dotted underline-offset-4 hover:decoration-foreground"
          >
            Start a round →
          </Link>
        </div>
      </section>
    </div>
  );
}

function Credit({
  num,
  label,
  title,
  href,
  children,
}: {
  num: string;
  label: string;
  title?: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs text-muted-foreground">{num}</span>
        <span className="label-eyebrow">{label}</span>
      </div>
      {title && (
        <h2 className="pl-8 text-xl font-semibold tracking-tight">
          {href ? (
            <Ext href={href} bare>
              {title}
            </Ext>
          ) : (
            title
          )}
        </h2>
      )}
      <div className="pl-8 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function Ext({
  href,
  children,
  bare = false,
}: {
  href: string;
  children: React.ReactNode;
  bare?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        bare
          ? "text-foreground underline decoration-dotted underline-offset-4 hover:decoration-foreground"
          : "text-foreground underline decoration-dotted underline-offset-2 hover:decoration-foreground"
      }
    >
      {children}
    </a>
  );
}
