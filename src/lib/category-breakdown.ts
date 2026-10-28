import type { Category, Transaction } from "./types";
import { categorySpentForMonth } from "./trends";

/** Reuse budget accounting so refunds offset their category and internal moves
 * never enter the pie. Nonpositive net categories have no spend to partition. */
export function buildCategoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  month: string,
) {
  const known = new Map(categories.map((category) => [category.id, category]));
  const rows = [...categorySpentForMonth(transactions, month)]
    .filter(([, cents]) => cents > 0)
    .map(([id, cents]) => ({
      id,
      name: id ? known.get(id)?.name : undefined,
      color: (id ? known.get(id)?.color : undefined) ?? "var(--primary-ink)",
      cents,
    }))
    .sort((a, b) => b.cents - a.cents);
  const totalCents = rows.reduce((sum, row) => sum + row.cents, 0);
  let offset = 0;
  return {
    totalCents,
    rows: rows.map((row) => {
      const percent = (row.cents / totalCents) * 100;
      const result = { ...row, percent, offset };
      offset += percent;
      return result;
    }),
  };
}
