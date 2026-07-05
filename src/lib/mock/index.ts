import type { BudgetSummary, User } from "@/lib/types";

/**
 * Sample dataset for the Sprout Final design (user "Sam"). Hydrates the client
 * store so the app runs before Neon is wired up. Split by domain to keep files
 * small; re-exported here.
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

export { mockCategories, HOME_CATEGORY_IDS } from "./categories";
export { mockTransactions } from "./transactions";
export { mockGoals } from "./goals";
export { mockRecurring, mockUpcomingBills, billsDueThisMonthCents } from "./recurring";
export { mockAccounts, mockTrend, mockTopMovers, spendingDonutSegments } from "./misc";
