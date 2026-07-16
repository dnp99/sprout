import { formatMoney } from "./format";
import { buildMoneyAxis, type MoneyAxisTick } from "./chart-axis";
import { monthKeyOf, shiftMonthKey, spendChangePercent } from "./trends";
import type { Transaction } from "./types";

export type OverviewComparisonPreset =
  "month-vs-last-month" | "month-vs-average-month" | "year-vs-last-year";

export interface OverviewComparisonPoint {
  label: string;
  currentCents: number;
  compareCents: number;
  currentTooltip: string;
  compareTooltip: string;
}

export interface OverviewComparisonTick {
  index: number;
  label: string;
}

export type OverviewYAxisTick = MoneyAxisTick;

export interface OverviewSpendingComparison {
  preset: OverviewComparisonPreset;
  currentLabel: string;
  compareLabel: string;
  headlineAmountCents: number;
  headlinePeriodLabel: string;
  compareAmountCents: number;
  deltaPct: number | null;
  points: OverviewComparisonPoint[];
  xTicks: OverviewComparisonTick[];
  yTicks: OverviewYAxisTick[];
  currentExtent: number;
  visiblePointCount: number;
  maxCents: number;
  /** The "nice" rounded ceiling the y-axis ticks span to. The chart scales
   *  bars/lines against this — not the raw data max — so the top gridline and
   *  its label sit at the top of the plot and the tallest mark keeps headroom. */
  axisMaxCents: number;
  /** Cumulative comparisons need both series; without a baseline, render the
   *  current period's individual days/months as bars instead. */
  chartMode: "comparison" | "single-period";
  currentSpendValues: number[];
}

const YEAR_MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function parseMonthKey(key: string) {
  const [year, month] = key.split("-").map(Number);
  return { year, month };
}

function daysInMonth(key: string): number {
  const { year, month } = parseMonthKey(key);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function isExpense(txn: Transaction): boolean {
  return !txn.isIncome && !txn.excludeFromBudget;
}

function monthDailySpend(transactions: Transaction[], key: string): number[] {
  const days = daysInMonth(key);
  const totals = Array.from({ length: days }, () => 0);
  for (const txn of transactions) {
    if (!isExpense(txn) || monthKeyOf(txn.occurredAt) !== key) continue;
    const day = new Date(txn.occurredAt).getUTCDate();
    totals[day - 1] += -txn.amountCents;
  }
  return totals;
}

function cumulative(values: number[]): number[] {
  let total = 0;
  return values.map((value) => {
    total += value;
    return total;
  });
}

function amountAt(series: number[], index: number): number {
  if (series.length === 0) return 0;
  return series[Math.min(Math.max(index, 0), series.length - 1)] ?? 0;
}

function isLiveMonth(key: string, now: Date): boolean {
  return key === currentMonthKeyFor(now);
}

function currentMonthKeyFor(now: Date): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function dayExtent(key: string, now: Date): number {
  return isLiveMonth(key, now)
    ? Math.min(now.getUTCDate(), daysInMonth(key)) - 1
    : daysInMonth(key) - 1;
}

function uniqueSorted(values: number[]): number[] {
  return [...new Set(values.filter((value) => value >= 0))].sort((a, b) => a - b);
}

function dayTicks(dayCount: number): OverviewComparisonTick[] {
  const indexes = uniqueSorted([
    0,
    Math.round((dayCount - 1) * 0.25),
    Math.round((dayCount - 1) * 0.5),
    Math.round((dayCount - 1) * 0.75),
    dayCount - 1,
  ]);
  return indexes.map((index) => ({ index, label: `Day ${index + 1}` }));
}

function monthTicks(visiblePointCount: number): OverviewComparisonTick[] {
  return dayTicks(visiblePointCount);
}

function yearTicks(visiblePointCount: number): OverviewComparisonTick[] {
  return [0, 2, 4, 6, 8, 10, 11]
    .filter((index) => index < visiblePointCount)
    .map((index) => ({ index, label: YEAR_MONTH_LABELS[index] }));
}

function compareMonthsAverage(
  transactions: Transaction[],
  currentKey: string,
  months = 6,
): number[] {
  const currentDays = daysInMonth(currentKey);
  const previous = Array.from({ length: months }, (_, index) =>
    shiftMonthKey(currentKey, -(index + 1)),
  ).reverse();
  const priorSeries = previous.map((key) => cumulative(monthDailySpend(transactions, key)));
  return Array.from({ length: currentDays }, (_, index) => {
    if (priorSeries.length === 0) return 0;
    const total = priorSeries.reduce((sum, series) => sum + amountAt(series, index), 0);
    return Math.round(total / priorSeries.length);
  });
}

function monthComparison(
  transactions: Transaction[],
  now: Date,
  mode: "last-month" | "average",
): OverviewSpendingComparison {
  const currentKey = currentMonthKeyFor(now);
  const currentLabel = "This month";
  const currentSpendValues = monthDailySpend(transactions, currentKey);
  const currentSeries = cumulative(currentSpendValues);
  const currentExtent = dayExtent(currentKey, now);
  const pointCount = currentSeries.length;

  const compareSeries =
    mode === "last-month"
      ? cumulative(monthDailySpend(transactions, shiftMonthKey(currentKey, -1)))
      : compareMonthsAverage(transactions, currentKey);
  const compareLabel = mode === "last-month" ? "Last month" : "Average month";

  const points = Array.from({ length: pointCount }, (_, index) => {
    const currentCents = amountAt(currentSeries, index);
    const compareCents = amountAt(compareSeries, index);
    return {
      label: `Day ${index + 1}`,
      currentCents,
      compareCents,
      currentTooltip: `${currentLabel} · Day ${index + 1} · ${formatMoney(currentCents)}`,
      compareTooltip: `${compareLabel} · Day ${index + 1} · ${formatMoney(compareCents)}`,
    };
  });

  const headlineAmountCents = amountAt(currentSeries, currentExtent);
  const compareAmountCents = amountAt(compareSeries, currentExtent);
  const chartMode =
    headlineAmountCents > 0 && compareAmountCents === 0 ? "single-period" : "comparison";
  const maxCents = Math.max(
    1,
    ...(chartMode === "single-period"
      ? currentSpendValues.slice(0, currentExtent + 1)
      : points.map((point) => Math.max(point.currentCents, point.compareCents))),
  );
  const axis = buildMoneyAxis(maxCents, chartMode === "single-period" ? 2 : 4);

  return {
    preset: mode === "last-month" ? "month-vs-last-month" : "month-vs-average-month",
    currentLabel,
    compareLabel,
    headlineAmountCents,
    headlinePeriodLabel: "this month",
    compareAmountCents,
    deltaPct: spendChangePercent(headlineAmountCents, compareAmountCents),
    points,
    xTicks: monthTicks(currentExtent + 1),
    yTicks: axis.ticks,
    currentExtent,
    visiblePointCount: currentExtent + 1,
    maxCents,
    axisMaxCents: axis.maxCents,
    chartMode,
    currentSpendValues,
  };
}

function yearMonthlySpend(transactions: Transaction[], year: number): number[] {
  const totals = Array.from({ length: 12 }, () => 0);
  for (const txn of transactions) {
    if (!isExpense(txn)) continue;
    const date = new Date(txn.occurredAt);
    if (date.getUTCFullYear() !== year) continue;
    totals[date.getUTCMonth()] += -txn.amountCents;
  }
  return totals;
}

function yearMonthlyCumulative(transactions: Transaction[], year: number): number[] {
  return cumulative(yearMonthlySpend(transactions, year));
}

function yearComparison(transactions: Transaction[], now: Date): OverviewSpendingComparison {
  const year = now.getUTCFullYear();
  const currentLabel = "This year";
  const compareLabel = "Last year";
  const currentSpendValues = yearMonthlySpend(transactions, year);
  const currentSeries = cumulative(currentSpendValues);
  const compareSeries = yearMonthlyCumulative(transactions, year - 1);
  const currentExtent = now.getUTCMonth();
  const points = YEAR_MONTH_LABELS.map((label, index) => {
    const currentCents = amountAt(currentSeries, index);
    const compareCents = amountAt(compareSeries, index);
    return {
      label,
      currentCents,
      compareCents,
      currentTooltip: `${currentLabel} · ${label} · ${formatMoney(currentCents)}`,
      compareTooltip: `${compareLabel} · ${label} · ${formatMoney(compareCents)}`,
    };
  });

  const headlineAmountCents = amountAt(currentSeries, currentExtent);
  const compareAmountCents = amountAt(compareSeries, currentExtent);
  const visiblePointCount = currentExtent + 1;
  const chartMode =
    headlineAmountCents > 0 && compareAmountCents === 0 ? "single-period" : "comparison";
  const maxCents = Math.max(
    1,
    ...(chartMode === "single-period"
      ? currentSpendValues.slice(0, currentExtent + 1)
      : points.map((point) => Math.max(point.currentCents, point.compareCents))),
  );
  const axis = buildMoneyAxis(maxCents, chartMode === "single-period" ? 2 : 4);

  return {
    preset: "year-vs-last-year",
    currentLabel,
    compareLabel,
    headlineAmountCents,
    headlinePeriodLabel: "this year",
    compareAmountCents,
    deltaPct: spendChangePercent(headlineAmountCents, compareAmountCents),
    points,
    xTicks: yearTicks(visiblePointCount),
    yTicks: axis.ticks,
    currentExtent,
    visiblePointCount,
    maxCents,
    axisMaxCents: axis.maxCents,
    chartMode,
    currentSpendValues,
  };
}

/** Build the Overview's spending-comparison chart so web + mobile show the
 *  same period math, labels, and fair same-progress comparisons. Month views
 *  compare at the current day of month; the yearly view compares at the current
 *  month of the year instead of pitting a partial year against a finished one. */
export function buildOverviewSpendingComparison(
  transactions: Transaction[],
  preset: OverviewComparisonPreset,
  now = new Date(),
): OverviewSpendingComparison {
  if (preset === "month-vs-last-month") return monthComparison(transactions, now, "last-month");
  if (preset === "month-vs-average-month") return monthComparison(transactions, now, "average");
  return yearComparison(transactions, now);
}
