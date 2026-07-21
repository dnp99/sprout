import { parseAmountToCents, parseMagnitudeCents, type DecimalNotation } from "./amount";
import { parseDate } from "./date";
import type { AmountMapping, ImportMapping, MappedRow } from "./types";

/** Normalize a source type value for case/whitespace-insensitive matching. */
function norm(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/** Resolve a source record's amount to signed cents per the mapping's mode.
 *  Exhaustive over AmountMapping so a new mode can't silently fall through. */
export function amountToCents(
  record: Record<string, string>,
  amount: AmountMapping,
  decimal?: DecimalNotation,
): number {
  switch (amount.mode) {
    case "signed": {
      const cents = parseAmountToCents(record[amount.column], decimal);
      return amount.expensesArePositive ? -cents : cents;
    }
    case "debitCredit":
      // credit = money in (+), debit = money out (−)
      return (
        parseMagnitudeCents(record[amount.creditColumn], decimal) -
        parseMagnitudeCents(record[amount.debitColumn], decimal)
      );
    case "inflowOutflow":
      return (
        parseMagnitudeCents(record[amount.inflowColumn], decimal) -
        parseMagnitudeCents(record[amount.outflowColumn], decimal)
      );
    case "signedByType": {
      // Positive magnitude + a debit/credit type column (e.g. legacy Mint).
      const magnitude = parseMagnitudeCents(record[amount.column], decimal);
      const type = norm(record[amount.typeColumn]);
      if (amount.creditValues.some((v) => norm(v) === type)) return magnitude;
      if (amount.debitValues.some((v) => norm(v) === type)) return -magnitude;
      // Unknown type: default to an outflow. The preflight flags unknown types
      // as row errors, so this never persists without an explicit decision.
      return -magnitude;
    }
    default:
      return assertNever(amount);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled amount mode: ${JSON.stringify(value)}`);
}

/** Apply a column mapping to one source record. */
export function applyMapping(record: Record<string, string>, mapping: ImportMapping): MappedRow {
  const sourceAccount = mapping.account
    ? "fixedName" in mapping.account
      ? mapping.account.fixedName
      : (record[mapping.account.column] ?? "").trim() || null
    : null;

  return {
    occurredAt: parseDate(record[mapping.date.column] ?? "", mapping.date.format),
    merchant: (record[mapping.merchant.column] ?? "").trim(),
    amountCents: amountToCents(record, mapping.amount, mapping.decimal),
    sourceCategory: mapping.category
      ? (record[mapping.category.column] ?? "").trim() || null
      : null,
    sourceAccount,
    note: mapping.notes ? (record[mapping.notes.column] ?? "").trim() || null : null,
  };
}
