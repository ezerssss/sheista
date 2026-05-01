"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function HandleSetup() {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cf_handle: handle.trim() }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Failed");
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="handle" className="text-xs font-medium text-muted-foreground">
          Codeforces handle
        </Label>
        <div className="flex items-center rounded-md border border-input transition-colors focus-within:border-foreground/50">
          <span className="select-none pl-3 pr-1 font-mono text-sm text-muted-foreground">@</span>
          <Input
            id="handle"
            placeholder="tourist"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handle && onSubmit()}
            className="border-0 px-1 font-mono shadow-none focus-visible:ring-0"
          />
        </div>
      </div>
      <Button
        onClick={onSubmit}
        disabled={!handle || submitting}
        className="w-full"
      >
        {submitting ? "Connecting…" : "Connect"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
