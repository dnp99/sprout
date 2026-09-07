/** Helpers for transaction timestamps.
 *
 *  A bare date like "2026-07-01" is a *calendar day*, not a midnight instant.
 *  Parsing it directly with `new Date("2026-07-01")` produces UTC midnight,
 *  which renders as the previous local day for users west of UTC. We normalize
 *  date-only inputs to **UTC noon** so they round-trip as the intended day for
 *  the app's target timezones, while preserving full ISO timestamps as-is. */

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Normalize a client-supplied occurredAt string to a canonical ISO instant.
 *  Returns null when the input is unparseable. */
export function normalizeOccurredAtInput(value: string): string | null {
  const s = value.trim();
  if (!s) return null;

  const dateOnly = s.match(DATE_ONLY);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    return new Date(Date.UTC(year, month - 1, day, 12)).toISOString();
  }

  const parsed = new Date(s);
  const ms = parsed.getTime();
  if (ms !== ms) return null;
  return parsed.toISOString();
}

/** Format an occurredAt instant for an `<input type="date">` using its UTC
 * transaction calendar day. This matches reporting/month buckets and prevents
 * midnight import timestamps from appearing as the previous local date. */
export function occurredAtInputValue(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
