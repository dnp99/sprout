import { createHash } from "node:crypto";

/** Deterministic per-source-row key so re-imports upsert instead of insert.
 *  `occurrence` disambiguates genuinely-identical charges on the same day (e.g.
 *  two identical Uber Eats orders) so real source-duplicates are preserved. */
export function externalId(input: {
  occurredAt: string;
  merchant: string;
  amountCents: number;
  sourceAccount: string | null;
  occurrence: number;
}): string {
  const key = [
    input.occurredAt,
    input.merchant.toLowerCase().trim(),
    String(input.amountCents),
    (input.sourceAccount ?? "").toLowerCase().trim(),
    String(input.occurrence),
  ].join("|");
  return createHash("sha256").update(key).digest("hex").slice(0, 32);
}
