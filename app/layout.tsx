import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "sheista — ThemeCP tracker",
  description: "Train competitive programming with the ThemeCP method. Track streaks, level, performance, and tag mastery.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <NavBar />
        <main className="container mx-auto py-6">{children}</main>
      </body>
    </html>
  );
}
