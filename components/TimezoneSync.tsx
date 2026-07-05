"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const GUARD_KEY = "sheista:tz-synced";

/**
 * Keeps profiles.timezone matched to the browser's IANA timezone. All streak
 * and heatmap day-buckets are computed server-side in that zone, so a stale
 * value (travel, first login after migration) shifts "today" for everything.
 * Renders nothing; PATCHes once per tab session when a mismatch is seen.
 */
export function TimezoneSync({ profileTimezone }: { profileTimezone: string }) {
  const router = useRouter();

  useEffect(() => {
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!browserTz || browserTz === profileTimezone) return;
    // One attempt per tab session — a failing PATCH must not refresh-loop.
    if (sessionStorage.getItem(GUARD_KEY) === browserTz) return;
    sessionStorage.setItem(GUARD_KEY, browserTz);
    void fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone: browserTz }),
    })
      .then((res) => res.json())
      .then((json) => {
        // Re-render server components with the corrected timezone buckets.
        if (json.ok) router.refresh();
      })
      .catch(() => null);
  }, [profileTimezone, router]);

  return null;
}
