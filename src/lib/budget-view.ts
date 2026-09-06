import { allocation } from "./budget";
import { categorySpentForMonth, monthKeyLabel, monthTotals } from "./trends";
import type { BudgetGroupPreference, Category, RecurringItem, Transaction } from "./types";

export type BudgetGroupId = "fixed" | "flexible";

export interface BudgetCategoryRow {
  categoryId: string;
  name: string;
  emoji: string;
  color: string;
  budgetCents: number;
  spentCents: number;
  remainingCents: number;
  progressPercent: number;
  isOver: boolean;
}

export interface BudgetGroup {
  id: BudgetGroupId;
  label: string;
  budgetCents: number;
  spentCents: number;
  remainingCents: number;
  rowCount: number;
  rows: BudgetCategoryRow[];
}

export interface BudgetTrackingView {
  monthKey: string;
  monthLabel: string;
  budgetCents: number;
  allocatedCents: number;
  leftToAllocateCents: number;
  spentCents: number;
  leftToSpendCents: number;
  allocationPercent: number;
  spendPercent: number;
  overAllocated: boolean;
  overSpent: boolean;
  groups: BudgetGroup[];
}

const FIXED_FALLBACK_LABELS = ["bills", "rent", "mortgage", "utilities", "insurance"];

function spentPercent(spentCents: number, budgetCents: number): number {
  if (budgetCents <= 0) return spentCents > 0 ? 100 : 0;
  return Math.min(100, Math.round((spentCents / budgetCents) * 100));
}

/** Whether a category counts as "Fixed" spend. An explicit user preference wins;
 *  legacy categories without one keep their recurring/name inference. Exported so
 *  the cash-flow Group breakdown stays aligned with the Budget screen. */
export function isFixedCategory(
  category: { id: string | null; name: string; budgetGroup?: BudgetGroupPreference | null },
  recurring: RecurringItem[],
): boolean {
  if (category.budgetGroup) return category.budgetGroup === "fixed";
  if (recurring.some((item) => !item.paused && !item.isIncome && item.categoryId === category.id)) {
    return true;
  }

  const normalized = category.name.toLowerCase();
  return FIXED_FALLBACK_LABELS.some((token) => normalized.includes(token));
}

function emptyGroup(id: BudgetGroupId, label: string): BudgetGroup {
  return {
    id,
    label,
    budgetCents: 0,
    spentCents: 0,
    remainingCents: 0,
    rowCount: 0,
    rows: [],
  };
}

/** Build the shared month-aware budget view model once so web + mobile render
 *  the same summary, grouping, and row math. Explicit category preferences win;
 *  older categories retain the recurring/name fallback until they are edited. */
export function buildBudgetTrackingView(args: {
  totalBudgetCents: number;
  budgets: Record<string, number>;
  categories: Category[];
  recurring: RecurringItem[];
  transactions: Transaction[];
  monthKey: string;
}): BudgetTrackingView {
  const { totalBudgetCents, budgets, categories, recurring, transactions, monthKey } = args;
  const { spentCents } = monthTotals(transactions, monthKey);
  const { allocated, remaining, percent, over } = allocation(budgets, totalBudgetCents);
  const spentByCategory = categorySpentForMonth(transactions, monthKey);

  const groups = new Map<BudgetGroupId, BudgetGroup>([
    ["fixed", emptyGroup("fixed", "Fixed")],
    ["flexible", emptyGroup("flexible", "Flexible")],
  ]);

  for (const category of categories) {
    const budgetCents = budgets[category.id] ?? 0;
    const categorySpent = spentByCategory.get(category.id) ?? 0;
    const remainingCents = budgetCents - categorySpent;
    const row: BudgetCategoryRow = {
      categoryId: category.id,
      name: category.name,
      emoji: category.emoji,
      color: category.color,
      budgetCents,
      spentCents: categorySpent,
      remainingCents,
      progressPercent: spentPercent(categorySpent, budgetCents),
      isOver: categorySpent > budgetCents,
    };

    const group = groups.get(isFixedCategory(category, recurring) ? "fixed" : "flexible");
    if (!group) continue;
    group.rows.push(row);
    group.budgetCents += budgetCents;
    group.spentCents += categorySpent;
    group.remainingCents += remainingCents;
    group.rowCount += 1;
  }

  return {
    monthKey,
    monthLabel: monthKeyLabel(monthKey),
    budgetCents: totalBudgetCents,
    allocatedCents: allocated,
    leftToAllocateCents: remaining,
    spentCents,
    leftToSpendCents: totalBudgetCents - spentCents,
    allocationPercent: percent,
    spendPercent: spentPercent(spentCents, totalBudgetCents),
    overAllocated: over,
    overSpent: spentCents > totalBudgetCents,
    groups: [...groups.values()].filter((group) => group.rowCount > 0),
  };
}
