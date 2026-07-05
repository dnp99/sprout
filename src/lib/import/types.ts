/** Types for the format-agnostic CSV import pipeline (plan 002). */

export type TxnKind = "expense" | "income" | "transfer" | "payment";

/** How a source CSV's amount column(s) map to a signed cents value. */
export type AmountMapping =
  | { mode: "signed"; column: string; expensesArePositive?: boolean }
  | { mode: "debitCredit"; debitColumn: string; creditColumn: string }
  | { mode: "inflowOutflow"; inflowColumn: string; outflowColumn: string };

/** Declares how a CSV's columns become Sprout transaction fields. A preset
 *  (e.g. Monarch) is just a saved ImportMapping. */
export interface ImportMapping {
  name: string;
  date: { column: string; format?: string };
  merchant: { column: string };
  amount: AmountMapping;
  category?: { column: string };
  account?: { column: string } | { fixedName: string };
  notes?: { column: string };
}

/** A row after column-mapping, before classify/dedupe. */
export interface MappedRow {
  occurredAt: string; // ISO date (YYYY-MM-DD)
  merchant: string;
  amountCents: number; // signed
  sourceCategory: string | null;
  sourceAccount: string | null;
  note: string | null;
}

/** A fully-processed row ready to persist. */
export interface ImportRow extends MappedRow {
  kind: TxnKind;
  excludeFromBudget: boolean;
  externalId: string;
}
