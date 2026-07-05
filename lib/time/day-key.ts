/**
 * Day-key utilities. A "day key" is a YYYY-MM-DD string in a specific IANA
 * timezone — the single source of truth for bucketing practice into days
 * (streaks, heatmaps, daily bites).
 *
 * Rule: NEVER bucket days with Date#getDate()-style local math. Server code
 * runs in UTC when deployed; the user lives in profiles.timezone. Every
 * bucketing call goes through dayKeyInTz with an explicit timezone, and
 * arithmetic on existing keys goes through shiftDayKey/diffDayKeys, which are
 * timezone-independent by construction.
 */

/** YYYY-MM-DD of instant `d` in `timeZone` (en-CA locale formats ISO-style). */
export function dayKeyInTz(d: Date, timeZone: string): string {
  return d.toLocaleDateString("en-CA", { timeZone });
}

/** Today's day key in `timeZone`. */
export function todayKey(timeZone: string, now: Date = new Date()): string {
  return dayKeyInTz(now, timeZone);
}

/**
 * Shift a day key by `n` whole days. Parses the key as UTC noon so DST/offset
 * quirks can never move it across a date boundary, then does UTC arithmetic.
 */
export function shiftDayKey(key: string, n: number): string {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Whole days from `b` to `a` (positive when `a` is later). */
export function diffDayKeys(a: string, b: string): number {
  const da = Date.UTC(
    Number(a.slice(0, 4)),
    Number(a.slice(5, 7)) - 1,
    Number(a.slice(8, 10)),
  );
  const db = Date.UTC(
    Number(b.slice(0, 4)),
    Number(b.slice(5, 7)) - 1,
    Number(b.slice(8, 10)),
  );
  return Math.round((da - db) / 86_400_000);
}

/** True when `tz` is an IANA timezone the runtime can format with. */
export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
