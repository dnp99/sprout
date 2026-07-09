/** Categories every new user starts with, so their app is usable immediately.
 *  Budgets start at $0: the user sets a total monthly budget, then allocates it
 *  across these categories in-app ("give every dollar a job"). Seeding non-zero
 *  budgets would over-allocate against a $0 pool on day one. See plans/007. */
export const DEFAULT_CATEGORIES = [
  { name: "Bills & rent", emoji: "🏠", color: "#d97a54", monthlyBudgetCents: 0 },
  { name: "Groceries", emoji: "🛒", color: "#c98a5a", monthlyBudgetCents: 0 },
  { name: "Dining out", emoji: "🍽️", color: "#7e9b6b", monthlyBudgetCents: 0 },
  { name: "Shopping", emoji: "🛍️", color: "#c25b3a", monthlyBudgetCents: 0 },
  { name: "Transport", emoji: "🚗", color: "#e7a34a", monthlyBudgetCents: 0 },
  { name: "Fun", emoji: "🎬", color: "#9a7b5a", monthlyBudgetCents: 0 },
];
