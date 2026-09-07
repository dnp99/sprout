/** Preflight: validate a parsed file against a mapping before any write, so the
 *  user sees what will import, what won't, and why. Pure — no DB access. */

import { parseMoney, type DecimalNotation } from "./amount";
import { parseDateStrict } from "./date";
import { normalizeCategoryLabel, resolveCategoryKey, type SproutCategoryKey } from "./category-map";
import type { AmountMapping, ImportMapping } from "./types";
import type { PresetId } from "./presets/types";
import { parseTransactionType } from "./transaction-type";

export interface RowError {
  /** 1-based line in the file (header is line 1). */
  row: number;
  reason: string;
}

export interface ImportPreflight {
  presetId: PresetId | "custom";
  confidence: "high" | "ambiguous" | "none";
  totalRows: number;
  validRows: number;
  /** First errors only (capped for display); `totalRows - validRows` is exact. */
  invalidRows: RowError[];
  /** Valid rows whose source category didn't map to a Sprout category. */
  unmatchedCategories: number;
  /** Signed total of valid rows, in cents. */
  amountTotalCents: number;
}

const MAX_REPORTED_ERRORS = 25;

/** Validate a record's amount for the mapping's mode; returns cents or a reason. */
function validateAmount(
  record: Record<string, string>,
  amount: AmountMapping,
  decimal?: DecimalNotation,
): { ok: true; cents: number } | { ok: false; reason: string } {
  switch (amount.mode) {
    case "signed": {
      const r = parseMoney(record[amount.column], decimal);
      if (!r.ok) return r;
      return { ok: true, cents: amount.expensesArePositive ? -r.cents : r.cents };
    }
    case "debitCredit": {
      const debit = (record[amount.debitColumn] ?? "").trim();
      const credit = (record[amount.creditColumn] ?? "").trim();
      if (!debit && !credit) return { ok: false, reason: "no debit or credit amount" };
      const d = debit ? parseMoney(debit, decimal) : { ok: true as const, cents: 0 };
      const c = credit ? parseMoney(credit, decimal) : { ok: true as const, cents: 0 };
      if (!d.ok) return d;
      if (!c.ok) return c;
      return { ok: true, cents: Math.abs(c.cents) - Math.abs(d.cents) };
    }
    case "inflowOutflow": {
      const inflow = (record[amount.inflowColumn] ?? "").trim();
      const outflow = (record[amount.outflowColumn] ?? "").trim();
      if (!inflow && !outflow) return { ok: false, reason: "no inflow or outflow amount" };
      const i = inflow ? parseMoney(inflow, decimal) : { ok: true as const, cents: 0 };
      const o = outflow ? parseMoney(outflow, decimal) : { ok: true as const, cents: 0 };
      if (!i.ok) return i;
      if (!o.ok) return o;
      return { ok: true, cents: Math.abs(i.cents) - Math.abs(o.cents) };
    }
    case "signedByType": {
      const r = parseMoney(record[amount.column], decimal);
      if (!r.ok) return r;
      const type = (record[amount.typeColumn] ?? "").trim().toLowerCase();
      const isCredit = amount.creditValues.some((v) => v.trim().toLowerCase() === type);
      const isDebit = amount.debitValues.some((v) => v.trim().toLowerCase() === type);
      if (!isCredit && !isDebit) {
        return {
          ok: false,
          reason: `unknown transaction type "${record[amount.typeColumn] ?? ""}"`,
        };
      }
      return { ok: true, cents: isCredit ? Math.abs(r.cents) : -Math.abs(r.cents) };
    }
    default:
      return { ok: false, reason: "unsupported amount mode" };
  }
}

/** Run the preflight over parsed records. `detection` supplies the source/
 *  confidence already resolved by `detectPreset` (or custom). */
export function preflight(
  records: Record<string, string>[],
  mapping: ImportMapping,
  categoryMap: Record<string, SproutCategoryKey>,
  detection: { presetId: PresetId | "custom"; confidence: "high" | "ambiguous" | "none" },
  userCategoryNames: readonly string[] = [],
): ImportPreflight {
  const invalidRows: RowError[] = [];
  let validRows = 0;
  let unmatchedCategories = 0;
  let amountTotalCents = 0;

  records.forEach((record, index) => {
    const line = index + 2; // header is line 1
    const reasons: string[] = [];

    const merchant = (record[mapping.merchant.column] ?? "").trim();
    if (!merchant) reasons.push("missing merchant");

    const date = parseDateStrict(record[mapping.date.column] ?? "", mapping.date.format);
    if (!date.ok) reasons.push(date.reason);

    const amount = validateAmount(record, mapping.amount, mapping.decimal);
    if (!amount.ok) reasons.push(amount.reason);

    if (mapping.transactionType) {
      const sourceType = (record[mapping.transactionType.column] ?? "").trim();
      const kind = sourceType ? parseTransactionType(sourceType) : null;
      if (sourceType && !kind) {
        reasons.push(`unknown transaction type "${sourceType}"`);
      } else if (kind && amount.ok) {
        if (kind === "expense" && amount.cents > 0) {
          reasons.push("expense must have a negative amount");
        }
        if ((kind === "income" || kind === "reimbursement") && amount.cents < 0) {
          reasons.push(`${kind} must have a positive amount`);
        }
      }
    }

    if (reasons.length > 0) {
      if (invalidRows.length < MAX_REPORTED_ERRORS) {
        invalidRows.push({ row: line, reason: reasons.join("; ") });
      }
      return;
    }

    validRows++;
    amountTotalCents += amount.ok ? amount.cents : 0;

    const sourceCategory = mapping.category ? (record[mapping.category.column] ?? "").trim() : "";
    const isUserCategory = userCategoryNames.some(
      (name) => normalizeCategoryLabel(name) === normalizeCategoryLabel(sourceCategory),
    );
    if (
      sourceCategory &&
      !isUserCategory &&
      resolveCategoryKey(sourceCategory, categoryMap) === null
    ) {
      unmatchedCategories++;
    }
  });

  return {
    presetId: detection.presetId,
    confidence: detection.confidence,
    totalRows: records.length,
    validRows,
    invalidRows,
    unmatchedCategories,
    amountTotalCents,
  };
}
