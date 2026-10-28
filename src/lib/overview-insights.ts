import {
  buildOverviewSpendingComparison,
  type OverviewComparisonPreset,
} from "./overview-comparison";
import type { Category, Transaction } from "./types";

export const ALL_CATEGORIES = "__all";
export const UNCATEGORIZED = "__uncategorized";
export const SHARED_PAYER = "__shared";
export type SpendingRecord = Transaction & { payerId?: string | null };
export type SpendingPayer = { id: string; name: string; color?: string };
export type SpendingDimension = "category" | "payer";

/** Use one period engine for every series and category. This keeps the ring,
 * timeline and unmatched-category rows on identical refund/cutoff rules. */
export function buildOverviewInsights(
  transactions: SpendingRecord[],
  categories: Category[],
  month: string,
  preset: OverviewComparisonPreset,
  selectedCategory = ALL_CATEGORIES,
  now = new Date(),
  options: {
    dimension?: SpendingDimension;
    payer?: string;
    payers?: SpendingPayer[];
    throughDate?: string;
  } = {},
) {
  const liveMonth = now.toISOString().slice(0, 7);
  const [year, monthNumber] = month.split("-").map(Number);
  const anchor = options.throughDate?.startsWith(month)
    ? new Date(options.throughDate + "T23:59:59Z")
    : month === liveMonth
      ? now
      : new Date(Date.UTC(year, monthNumber, 0, 23, 59, 59));
  const keyOf = (row: Transaction) => row.categoryId ?? UNCATEGORIZED;
  const payerKey = (row: SpendingRecord) => row.payerId ?? SHARED_PAYER;
  const dimension = options.dimension ?? "category";
  const groupKey = dimension === "payer" ? payerKey : keyOf;
  const scoped = transactions.filter(
    (row) =>
      (selectedCategory === ALL_CATEGORIES || keyOf(row) === selectedCategory) &&
      (!options.payer || options.payer === ALL_CATEGORIES || payerKey(row) === options.payer),
  );
  const raw = buildOverviewSpendingComparison(scoped, preset, anchor);
  const currentLabel = preset === "year-vs-last-year" ? String(year) : month;
  const compareLabel =
    preset === "year-vs-last-year"
      ? String(year - 1)
      : preset === "month-vs-last-month"
        ? String(new Date(Date.UTC(year, monthNumber - 2, 1)).toISOString().slice(0, 7))
        : raw.compareLabel;
  const comparison = {
    ...raw,
    currentLabel,
    compareLabel,
    points: raw.points.map((point) => ({
      ...point,
      currentTooltip: point.currentTooltip.replace(raw.currentLabel, currentLabel),
      compareTooltip: point.compareTooltip.replace(raw.compareLabel, compareLabel),
    })),
  };
  const ids = [
    ...new Set(scoped.filter((row) => !row.isIncome && !row.excludeFromBudget).map(groupKey)),
  ];
  const rows = ids
    .map((id) => {
      const group = scoped.filter((row) => groupKey(row) === id);
      const category = categories.find((row) => row.id === id);
      const payer = options.payers?.find((row) => row.id === id);
      const series = buildOverviewSpendingComparison(group, preset, anchor);
      const currentCents = series.headlineAmountCents;
      const compareCents = series.compareAmountCents;
      return {
        id,
        name:
          dimension === "payer"
            ? (payer?.name ?? id)
            : (category?.name ?? (id === UNCATEGORIZED ? undefined : group[0]?.categoryName)),
        color: (dimension === "payer" ? payer?.color : category?.color) ?? "var(--primary-ink)",
        currentCents,
        compareCents,
        presence:
          currentCents !== 0 && compareCents !== 0
            ? "shared"
            : currentCents !== 0
              ? "current-only"
              : "comparison-only",
      };
    })
    .filter((row) => row.currentCents !== 0 || row.compareCents !== 0)
    .sort((a, b) => b.currentCents - a.currentCents || b.compareCents - a.compareCents);
  // A credit cannot occupy a positive area. Keep it in the separate table,
  // while the headline and time series continue to show the signed net total.
  const totalPositiveCents = rows.reduce((sum, row) => sum + Math.max(0, row.currentCents), 0);
  let offset = 0;
  const slices = rows
    .filter((row) => row.currentCents > 0)
    .map((row) => {
      const percent = (row.currentCents / totalPositiveCents) * 100;
      const slice = { ...row, percent, offset };
      offset += percent;
      return slice;
    });
  return { comparison, rows, slices, totalPositiveCents };
}
export type OverviewInsights = ReturnType<typeof buildOverviewInsights>;
