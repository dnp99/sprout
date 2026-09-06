import type { Transaction } from "./types";
import { isReimbursement } from "./transactions/reimbursement";

/** Round-ups: the "spare change" on each purchase, sweepable into a savings
 *  goal. Pure — unit-tested. Money stays integer cents throughout. */

/** Spare change on an expense: what it takes to round the magnitude up to the
 *  next whole dollar. 0 for whole-dollar amounts and for non-expenses (income /
 *  positive amounts don't generate round-ups). */
export function roundUpCents(amountCents: number): number {
  if (amountCents >= 0) return 0;
  const mag = Math.abs(amountCents);
  return (100 - (mag % 100)) % 100;
}

/** Whether a transaction contributes to round-ups: an expense that counts toward
 *  the budget (not income, not an internal move) and hasn't been swept yet. */
export function isRoundupEligible(t: Transaction): boolean {
  return !t.isIncome && !isReimbursement(t) && !t.excludeFromBudget && !t.roundupSwept;
}

/** Total spare change currently available to sweep into a goal. */
export function availableRoundupsCents(transactions: Transaction[]): number {
  return transactions.reduce(
    (sum, t) => (isRoundupEligible(t) ? sum + roundUpCents(t.amountCents) : sum),
    0,
  );
}
