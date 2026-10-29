import { applyMapping } from "@/lib/import/apply-mapping";
import { classify } from "@/lib/import/classify";
import { preflight } from "@/lib/import/preflight";
import type { ImportMapping } from "@/lib/import/types";
import { MAX_CENTS } from "./validation";

export const MAX_GROUP_IMPORT_BYTES = 8_000_000;
export const MAX_GROUP_IMPORT_ROWS = 5000;

/** Group refunds must reference an expense; bank transfers/payments must not
 * become household spending. Use identical eligibility in preview and save. */
export function groupImportRowError(
  record: Record<string, string>,
  mapping: ImportMapping,
): string | null {
  const check = preflight([record], mapping, {}, { presetId: "custom", confidence: "none" });
  if (!check.validRows) return check.invalidRows[0]?.reason ?? "Invalid row";
  const row = applyMapping(record, mapping);
  const { kind } = classify(
    row.sourceCategory,
    row.amountCents,
    row.merchant,
    row.sourceTransactionType,
  );
  if (kind !== "expense" && kind !== "income")
    return "Transfers, payments and reimbursements require a separate group record";
  if (!row.amountCents || Math.abs(row.amountCents) > MAX_CENTS)
    return "Amount outside the group storage range";
  if (row.merchant.length > 120 || (row.note?.length ?? 0) > 500)
    return "Description or note is too long";
  return null;
}

/** Retain personal preflight's category detection, with group-specific rejected
 * rows counted before confirmation rather than silently changing their kind. */
export const groupImportPreflight: typeof preflight = (
  records,
  mapping,
  categories,
  detection,
  names,
) => {
  const valid: Record<string, string>[] = [];
  const errors: { row: number; reason: string }[] = [];
  records.forEach((record, index) => {
    const reason = groupImportRowError(record, mapping);
    if (reason) errors.push({ row: index + 2, reason });
    else valid.push(record);
  });
  return {
    ...preflight(valid, mapping, categories, detection, names),
    totalRows: records.length,
    invalidRows: errors.slice(0, 25),
  };
};
