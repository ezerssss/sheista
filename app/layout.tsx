import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { PetCompanion } from "@/components/pet/PetCompanion";
import { LevelChangeOverlay } from "@/components/LevelChangeOverlay";
import { PreviewPanel } from "@/components/dev/PreviewPanel";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "sheista — themecp tracker",
  description:
    "A personal ThemeCP tracker. Daily 4-problem mocks, a self-balancing ladder, streaks, per-tag mastery.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <NavBar />
        <main className="container mx-auto px-6 py-10 lg:py-14">{children}</main>
        <footer className="mt-16 border-t border-border">
          <div className="container mx-auto flex flex-wrap items-center gap-x-3 gap-y-2 px-6 py-6 text-xs text-muted-foreground">
            <span className="font-medium tracking-tight text-foreground">sheista</span>
            <span className="text-border">/</span>
            <span>
              themecp method by{" "}
              <a
                className="underline decoration-dotted underline-offset-4 hover:text-foreground"
                href="https://codeforces.com/blog/entry/136704"
                target="_blank"
                rel="noopener noreferrer"
              >
                pwned
              </a>
            </span>
            <span className="text-border">·</span>
            <span>codeforces public api</span>
            <span className="ml-auto">
              <a
                className="underline decoration-dotted underline-offset-4 hover:text-foreground"
                href="/about"
              >
                about &amp; credits
              </a>
            </span>
          </div>
        </footer>
        <PetCompanion />
        <LevelChangeOverlay />
        <PreviewPanel />
      </body>
    </html>
  );
}
