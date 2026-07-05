/** App-facing types. These mirror the DB rows but carry derived display fields
 *  (spent totals, date labels) that the UI needs. */

export interface User {
  id: string;
  name: string;
  greetingName: string;
  email: string;
  currency: string;
  budgetCycle: "monthly" | "weekly" | "biweekly";
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  /** Hex accent for the progress bar / icon. */
  color: string;
  monthlyBudgetCents: number;
  /** Spent so far this cycle, in cents (derived). */
  spentCents: number;
}

export interface Transaction {
  id: string;
  merchant: string;
  emoji: string;
  categoryId: string | null;
  categoryName: string;
  /** Signed cents: negative = expense, positive = income. */
  amountCents: number;
  note?: string | null;
  method: string;
  status: "posted" | "pending";
  /** Human label used by the design: "Today", "Yesterday", "Jun 12". */
  dateLabel: string;
  occurredAt: string;
}

export interface BudgetSummary {
  /** Left to spend safely this cycle, in cents. */
  safeToSpendCents: number;
  spentCents: number;
  budgetCents: number;
  daysLeft: number;
}

export type TabKey = "home" | "categories" | "add" | "goals" | "bills";
