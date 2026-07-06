import { applyMapping } from "./apply-mapping";
import { classify } from "./classify";
import { externalId } from "./dedupe";
import type { ImportMapping, ImportRow } from "./types";

/** Turn source records into fully-processed import rows: map columns → classify
 *  → assign a dedupe key (with an occurrence counter for same-key duplicates).
 *  Rows missing a merchant or date are dropped. Pure — no DB access. */
export function buildImportRows(
  records: Record<string, string>[],
  mapping: ImportMapping,
): ImportRow[] {
  const occurrences = new Map<string, number>();
  const rows: ImportRow[] = [];

  for (const record of records) {
    const base = applyMapping(record, mapping);
    if (!base.merchant || !base.occurredAt) continue;

    const { kind, excludeFromBudget } = classify(
      base.sourceCategory,
      base.amountCents,
      base.merchant,
    );

    const dedupeKey = [
      base.occurredAt,
      base.merchant.toLowerCase().trim(),
      String(base.amountCents),
      (base.sourceAccount ?? "").toLowerCase().trim(),
    ].join("|");
    const occurrence = occurrences.get(dedupeKey) ?? 0;
    occurrences.set(dedupeKey, occurrence + 1);

    rows.push({
      ...base,
      kind,
      excludeFromBudget,
      externalId: externalId({
        occurredAt: base.occurredAt,
        merchant: base.merchant,
        amountCents: base.amountCents,
        sourceAccount: base.sourceAccount,
        occurrence,
      }),
    });
  }

  return rows;
}
