import type { Transaction } from "@/lib/types";

export type BulkSelectionContext = {
  count: number;
  kind: "expense" | "income" | "mixed";
  categoryState: "single" | "mixed";
  incomeSourceState: "single" | "mixed";
};

/** Only show a classifier when every selected row can accept that classifier. */
export function getBulkSelectionContext(rows: Transaction[]): BulkSelectionContext {
  const kind = rows.every((row) => row.isIncome)
    ? "income"
    : rows.every((row) => !row.isIncome)
      ? "expense"
      : "mixed";
  const state = (values: Array<string | null | undefined>) =>
    new Set(values).size > 1 ? "mixed" : "single";
  return {
    count: rows.length,
    kind,
    categoryState: state(rows.map((row) => row.categoryId)),
    incomeSourceState: state(rows.map((row) => row.incomeSourceId)),
  };
}
