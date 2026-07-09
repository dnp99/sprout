/** Reconcile a later bank CSV against transactions already captured through a
 *  channel (WhatsApp/Siri), so the same purchase isn't counted twice.
 *
 *  A channel capture keys its row on the message id (`external_id`); a CSV row
 *  keys on a row hash — so exact `external_id` dedupe can't catch the overlap.
 *  Instead we match on the money: **same signed `amountCents`** (exact equality
 *  already encodes sign + magnitude) and **`occurredAt` within ±windowDays** to
 *  absorb the lag between when a purchase is captured and when the bank posts it.
 *  Deliberately conservative (exact cents) — see plans/008. Pure + unit-tested. */

export interface ReconcileCandidate {
  id: string;
  /** Signed integer cents. */
  amountCents: number;
  occurredAt: Date | string;
}

export interface ReconcileRow {
  /** Signed integer cents. */
  amountCents: number;
  occurredAt: Date | string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** The first prior capture that a CSV row duplicates, or null. Callers skip the
 *  CSV row when this is non-null (the capture is the source of truth). */
export function findLikelyCaptureDuplicate(
  candidates: ReconcileCandidate[],
  row: ReconcileRow,
  windowDays = 4,
): ReconcileCandidate | null {
  const rowTime = toTime(row.occurredAt);
  const windowMs = windowDays * DAY_MS;
  for (const candidate of candidates) {
    // Exact signed-cents equality — same sign AND magnitude in one check.
    if (candidate.amountCents !== row.amountCents) continue;
    if (Math.abs(toTime(candidate.occurredAt) - rowTime) <= windowMs) return candidate;
  }
  return null;
}

function toTime(d: Date | string): number {
  return (d instanceof Date ? d : new Date(d)).getTime();
}
