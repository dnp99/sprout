import { normalizeMerchant } from "@/lib/import/normalize";

/** A minimal transaction shape for rule matching (works with the app's
 *  `Transaction` and a DB row alike). */
export interface RuleMatchable {
  id: string;
  merchant: string;
  /** Positive amount = income; income has no category by design. */
  isIncome?: boolean;
  /** Internal moves (transfers, card/loan payments) stay out of categorization. */
  excludeFromBudget?: boolean;
}

/** True when a merchant normalizes to the rule's pattern. */
export function ruleMatches(merchant: string, pattern: string): boolean {
  return normalizeMerchant(merchant) === pattern;
}

/** IDs of the transactions a rule would recategorize: same normalized merchant,
 *  and categorizable (not income, not budget-excluded). Pure — used for the
 *  client's "apply to N" preview and mirrored server-side on apply. */
export function matchingTransactionIds<T extends RuleMatchable>(
  transactions: T[],
  pattern: string,
): string[] {
  if (!pattern) return [];
  return transactions
    .filter((t) => !t.isIncome && !t.excludeFromBudget && ruleMatches(t.merchant, pattern))
    .map((t) => t.id);
}
