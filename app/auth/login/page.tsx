"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setStatus("sending");
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (err) {
      setError(err.message);
      setStatus("error");
      return;
    }
    setStatus("sent");
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="label-eyebrow">Sign in</p>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Magic link only. Enter your email; we&apos;ll send a one-tap login link.
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={status === "sending" || status === "sent"}
          />
        </div>
        <Button
          onClick={send}
          disabled={!email || status === "sending" || status === "sent"}
          className="w-full"
        >
          {status === "sending" ? "Sending…" : status === "sent" ? "Check your inbox" : "Send magic link"}
        </Button>
        {status === "sent" && (
          <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            Click the link we just emailed you — it&apos;ll bring you back here, signed in.
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm py-6">
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
