import type { TxnKind } from "./types";

/** Derive kind + budget-exclusion from the source category and amount sign.
 *  Internal moves (transfers, card/loan/mortgage payments) are excluded from
 *  budget math; everything else is income (positive) or expense (negative). */
export function classify(
  sourceCategory: string | null,
  amountCents: number,
): { kind: TxnKind; excludeFromBudget: boolean } {
  const c = (sourceCategory ?? "").toLowerCase();

  if (c.includes("transfer")) {
    return { kind: "transfer", excludeFromBudget: true };
  }
  if (
    c.includes("credit card payment") ||
    c.includes("card payment") ||
    c.includes("loan repayment") ||
    c.includes("loan payment") ||
    c.includes("mortgage payment")
  ) {
    return { kind: "payment", excludeFromBudget: true };
  }
  if (amountCents > 0) {
    return { kind: "income", excludeFromBudget: false };
  }
  return { kind: "expense", excludeFromBudget: false };
}
