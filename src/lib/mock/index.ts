import type { BudgetSummary, User } from "@/lib/types";

/**
 * Offline fallback dataset (user "Sam"). Used **only** as the store's degraded
 * mode when the API is unreachable (and the seed script's user identity) — never
 * imported by a component or route. Real screens render DB data; if you need a
 * new fallback field, add it here, not in a view.
 */

export const mockUser: User = {
  id: "u_sam",
  name: "Sam Rivera",
  greetingName: "Sam",
  email: "sam@sprout.money",
  currency: "USD",
  budgetCycle: "monthly",
};

/** Headline figures from the design's Home hero + Overview. */
export const mockSummary: BudgetSummary = {
  safeToSpendCents: 248000,
  spentCents: 324000,
  budgetCents: 400000,
  incomeCents: 320000,
  savedCents: 62000,
  daysLeft: 6,
  monthLabel: "June 2026",
};

export { mockCategories } from "./categories";
export { mockTransactions } from "./transactions";
export { mockGoals } from "./goals";
export { mockRecurring } from "./recurring";
