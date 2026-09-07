import type { TxnKind } from "./types";

const TRANSACTION_TYPES = ["expense", "income", "reimbursement", "transfer", "payment"] as const;

/** Parse the user-facing spreadsheet type values without making case or stray
 * whitespace significant. A type column is optional, but supplied values must
 * be one of these explicit transaction kinds. */
export function parseTransactionType(value: string | null | undefined): TxnKind | null {
  const normalized = (value ?? "").trim().toLowerCase();
  return TRANSACTION_TYPES.includes(normalized as TxnKind) ? (normalized as TxnKind) : null;
}

/** Transfers and payments are real records but never budget activity. */
export function excludesFromBudget(kind: TxnKind): boolean {
  return kind === "transfer" || kind === "payment";
}
