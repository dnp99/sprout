import type { Category } from "@/lib/types";

/** Category budgets & spend from the Sprout Final design (June 2026). Shopping
 *  is intentionally over budget ($310 spent / $250) to exercise the over-budget
 *  state. Money in cents. */
export const mockCategories: Category[] = [
  {
    id: "bills",
    name: "Bills & rent",
    emoji: "🏠",
    color: "#d97a54",
    monthlyBudgetCents: 100000,
    spentCents: 96000,
  },
  {
    id: "groceries",
    name: "Groceries",
    emoji: "🛒",
    color: "#c98a5a",
    monthlyBudgetCents: 60000,
    spentCents: 52000,
  },
  {
    id: "shopping",
    name: "Shopping",
    emoji: "🛍️",
    color: "#c25b3a",
    monthlyBudgetCents: 25000,
    spentCents: 31000,
  },
  {
    id: "dining",
    name: "Dining out",
    emoji: "🍽️",
    color: "#7e9b6b",
    monthlyBudgetCents: 30000,
    spentCents: 28000,
  },
  {
    id: "fun",
    name: "Fun",
    emoji: "🎬",
    color: "#e7a34a",
    monthlyBudgetCents: 22000,
    spentCents: 19000,
  },
  {
    id: "transport",
    name: "Transport",
    emoji: "🚗",
    color: "#7e9b6b",
    monthlyBudgetCents: 20000,
    spentCents: 14000,
  },
];
