/** Types for the format-agnostic CSV import pipeline (plan 002, plan 014). */

import type { DecimalNotation } from "./amount";

export type TxnKind = "expense" | "income" | "reimbursement" | "transfer" | "payment";

/** How a source CSV's amount column(s) map to a signed cents value.
 *  `signedByType` covers sources (e.g. legacy Mint) that store a positive
 *  magnitude plus a separate debit/credit type column. */
export type AmountMapping =
  | { mode: "signed"; column: string; expensesArePositive?: boolean }
  | { mode: "debitCredit"; debitColumn: string; creditColumn: string }
  | { mode: "inflowOutflow"; inflowColumn: string; outflowColumn: string }
  | {
      mode: "signedByType";
      column: string;
      typeColumn: string;
      debitValues: readonly string[];
      creditValues: readonly string[];
    };

/** Declares how a CSV's columns become Sprout transaction fields. A preset
 *  (e.g. Monarch) is just a saved ImportMapping. `decimal` declares the money
 *  notation so a decimal comma can't be misread; omit for period (US). */
export interface ImportMapping {
  name: string;
  date: { column: string; format?: string };
  merchant: { column: string };
  amount: AmountMapping;
  category?: { column: string };
  /** Optional CSV column that names an existing income source. Applied only to
   * positive rows; unmatched names remain unassigned rather than creating data. */
  incomeSource?: { column: string };
  account?: { column: string } | { fixedName: string };
  notes?: { column: string };
  decimal?: DecimalNotation;
}

/** A row after column-mapping, before classify/dedupe. */
export interface MappedRow {
  occurredAt: string; // ISO date (YYYY-MM-DD)
  merchant: string;
  amountCents: number; // signed
  sourceCategory: string | null;
  sourceIncome: string | null;
  sourceAccount: string | null;
  note: string | null;
}

/** A fully-processed row ready to persist. */
export interface ImportRow extends MappedRow {
  kind: TxnKind;
  excludeFromBudget: boolean;
  externalId: string;
}

/** Outcome of an import run — returned to the client and logged by the CLI.
 *  One definition, shared by the server pipeline and the client hook. */
export interface ImportSummary {
  imported: number;
  excluded: number;
  uncategorized: number;
  /** CSV rows skipped because they duplicate a prior channel capture (plans/008). */
  reconciled: number;
  accounts: number;
  /** Merchants categorized by the AI fallback this run (each cached as a rule). */
  aiCategorized: number;
}
