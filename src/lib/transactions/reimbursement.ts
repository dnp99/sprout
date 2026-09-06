import type { Transaction } from "@/lib/types";

/** Whether a positive transaction repays a prior expense rather than earning income. */
export function isReimbursement(transaction: Pick<Transaction, "kind">): boolean {
  return transaction.kind === "reimbursement";
}

/** A transaction's effect on expense totals. A reimbursement is positive cash
 * but negative spending, so it offsets the category it was assigned to. */
export function expenseContributionCents(
  transaction: Pick<Transaction, "amountCents" | "isIncome" | "kind">,
): number {
  return transaction.isIncome ? 0 : -transaction.amountCents;
}
