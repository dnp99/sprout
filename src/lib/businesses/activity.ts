import type { Transaction } from "@/lib/types";
import { isReimbursement } from "@/lib/transactions/reimbursement";

export const NO_BUSINESS = "__no_business__";
/** A business is an independent label; missing legacy assignments are unassigned. */
export function matchesBusiness(transaction: Pick<Transaction, "businessId">, businessId?: string) {
  return (
    !businessId ||
    businessId === "all" ||
    (businessId === NO_BUSINESS ? !transaction.businessId : transaction.businessId === businessId)
  );
}
/** Cash activity follows filters; reimbursements reduce expenses rather than becoming earned income. */
export function businessActivity(rows: Transaction[]) {
  let incomeCents = 0,
    expenseCents = 0;
  for (const row of rows) {
    if (row.excludeFromBudget) continue;
    if (isReimbursement(row)) expenseCents -= row.amountCents;
    else if (row.isIncome) incomeCents += row.amountCents;
    else expenseCents -= row.amountCents;
  }
  return { incomeCents, expenseCents, netCents: incomeCents - expenseCents };
}
