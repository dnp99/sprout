import { parseAmountToCents, parseMagnitudeCents } from "./amount";
import { parseDate } from "./date";
import type { AmountMapping, ImportMapping, MappedRow } from "./types";

/** Resolve a source record's amount to signed cents per the mapping's mode. */
export function amountToCents(record: Record<string, string>, amount: AmountMapping): number {
  if (amount.mode === "signed") {
    const cents = parseAmountToCents(record[amount.column]);
    return amount.expensesArePositive ? -cents : cents;
  }
  if (amount.mode === "debitCredit") {
    // credit = money in (+), debit = money out (−)
    return (
      parseMagnitudeCents(record[amount.creditColumn]) -
      parseMagnitudeCents(record[amount.debitColumn])
    );
  }
  return (
    parseMagnitudeCents(record[amount.inflowColumn]) -
    parseMagnitudeCents(record[amount.outflowColumn])
  );
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
    amountCents: amountToCents(record, mapping.amount),
    sourceCategory: mapping.category
      ? (record[mapping.category.column] ?? "").trim() || null
      : null,
    sourceAccount,
    note: mapping.notes ? (record[mapping.notes.column] ?? "").trim() || null : null,
  };
}
