import { DEFAULT_LOCALE, type AppLocale } from "./locale";
import { buildMoneyAxis, type MoneyAxisTick } from "./chart-axis";
import type { Transaction } from "./types";
import {
  latestMonthKey,
  monthKeyOf,
  shiftMonthKey,
  spendChangePercent,
  type MonthSpend,
} from "./trends";

/** Period-aggregate "Trends & reports" analytics, computed from the loaded
 *  transaction set. Where {@link ./trends} is single-month, this rolls up a whole
 *  window (this month / last 6 / last 12 / year-to-date). Pure + testable.
 *  Internal moves (`excludeFromBudget`) are excluded so totals match the budget
 *  math; cents are positive magnitudes. */

export type TrendPeriod = "month" | "6m" | "12m" | "ytd";

/** Which report the Trends screen shows — cash flow (income vs expenses vs net)
 *  or the spending breakdown. See plan 012. */
export type TrendView = "cashflow" | "spending";

export interface ReportCategory {
  name: string;
  emoji: string;
  cents: number;
  /** Share of the window's total spending, 0–100. */
  pct: number;
}

export interface ReportMover {
  name: string;
  emoji: string;
  /** Spend change vs the previous equal-length window (positive = spent more). */
  deltaCents: number;
}

export interface ReportMerchant {
  name: string;
  emoji: string;
  cents: number;
  count: number;
}

export interface ReportChartPoint {
  key: string;
  label: string;
  spentCents: number;
}

export interface TrendsReport {
  period: TrendPeriod;
  /** "This month" / "Last 6 months" / "Last 12 months" / "Year to date". */
  periodLabel: string;
  /** The window's date span, e.g. "Jul 2026" or "Feb–Jul 2026". */
  rangeLabel: string;
  monthsInWindow: number;
  incomeCents: number;
  spendingCents: number;
  netCents: number;
  txnCount: number;
  byCategory: ReportCategory[];
  topMovers: ReportMover[];
  frequentSpots: ReportMerchant[];
  chart: {
    points: ReportChartPoint[];
    granularity: "day" | "month";
    totalCents: number;
    changePct: number | null;
    /** Exact prior range used for `changePct`, localized for display. */
    comparisonLabel: string | null;
    /** Live-month comparisons stop the prior month at this same day. */
    comparisonThroughDay: number | null;
    /** Visible currency scale; `axisMaxCents` matches the top tick. */
    yTicks: MoneyAxisTick[];
    axisMaxCents: number;
    /** Day or month key to highlight as "current". */
    currentKey: string;
  };
}

const PERIOD_LABEL: Record<TrendPeriod, string> = {
  month: "This month",
  "6m": "Last 6 months",
  "12m": "Last 12 months",
  ytd: "Year to date",
};

/** `n` month keys ending at (and including) `anchorKey`, oldest first. */
function keysEndingAt(anchorKey: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => shiftMonthKey(anchorKey, -(n - 1 - i)));
}

/** The month keys covered by a period, anchored at `anchorKey`. YTD spans
 *  January of the anchor's year through the anchor month. */
export function periodMonthKeys(period: TrendPeriod, anchorKey: string): string[] {
  switch (period) {
    case "month":
      return [anchorKey];
    case "6m":
      return keysEndingAt(anchorKey, 6);
    case "12m":
      return keysEndingAt(anchorKey, 12);
    case "ytd": {
      const month = Number(anchorKey.split("-")[1]) || 1;
      return keysEndingAt(anchorKey, month);
    }
  }
}

/** Bucket spend/income by month for an explicit set of month keys (oldest
 *  first). Unlike {@link monthlyTrend} this accepts arbitrary key windows (e.g.
 *  a YTD span), not just a trailing count. */
export function monthlySpendForKeys(
  transactions: Transaction[],
  keys: string[],
  locale: AppLocale = DEFAULT_LOCALE,
): MonthSpend[] {
  const byKey = new Map<string, MonthSpend>();
  const buckets = keys.map((key) => {
    const [y, m] = key.split("-").map(Number);
    const bucket: MonthSpend = {
      key,
      label: new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(locale, {
        month: "short",
        timeZone: "UTC",
      }),
      spentCents: 0,
      incomeCents: 0,
    };
    byKey.set(key, bucket);
    return bucket;
  });
  for (const t of transactions) {
    if (t.excludeFromBudget) continue;
    const bucket = byKey.get(monthKeyOf(t.occurredAt));
    if (!bucket) continue;
    if (t.isIncome) bucket.incomeCents += t.amountCents;
    else bucket.spentCents += -t.amountCents;
  }
  return buckets;
}

/** Per-category expense totals over a set of months, keyed by display name. */
function categorySpendForKeys(transactions: Transaction[], keys: Set<string>) {
  const byName = new Map<string, { name: string; emoji: string; cents: number }>();
  for (const t of transactions) {
    if (t.excludeFromBudget || t.isIncome) continue;
    if (!keys.has(monthKeyOf(t.occurredAt))) continue;
    const existing = byName.get(t.categoryName);
    if (existing) existing.cents += -t.amountCents;
    else
      byName.set(t.categoryName, { name: t.categoryName, emoji: t.emoji, cents: -t.amountCents });
  }
  return byName;
}

const MONTH_SHORT = (key: string, locale: AppLocale) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(locale, {
    month: "short",
    timeZone: "UTC",
  });
};

/** "Jul 2026" for a single month, "Feb–Jul 2026" / "Nov 2025 – Feb 2026" for a span. */
function rangeLabel(keys: string[], locale: AppLocale): string {
  if (keys.length === 0) return "";
  const first = keys[0];
  const last = keys[keys.length - 1];
  const [fy] = first.split("-").map(Number);
  const [ly] = last.split("-").map(Number);
  if (keys.length === 1) return `${MONTH_SHORT(first, locale)} ${fy}`;
  if (fy === ly) return `${MONTH_SHORT(first, locale)}–${MONTH_SHORT(last, locale)} ${ly}`;
  return `${MONTH_SHORT(first, locale)} ${fy} – ${MONTH_SHORT(last, locale)} ${ly}`;
}

function daysInMonth(key: string): number {
  const [year, month] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function dayKey(monthKey: string, day: number): string {
  return `${monthKey}-${String(day).padStart(2, "0")}`;
}

function monthKeyForDate(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function spendingThroughDay(
  transactions: Transaction[],
  monthKeyValue: string,
  throughDay: number,
): number {
  return transactions.reduce((sum, transaction) => {
    if (transaction.excludeFromBudget || transaction.isIncome) return sum;
    if (monthKeyOf(transaction.occurredAt) !== monthKeyValue) return sum;
    if (new Date(transaction.occurredAt).getUTCDate() > throughDay) return sum;
    return sum - transaction.amountCents;
  }, 0);
}

function dailySpendForMonth(
  transactions: Transaction[],
  monthKeyValue: string,
): ReportChartPoint[] {
  const totalDays = daysInMonth(monthKeyValue);
  const tickDays = new Set([1, 8, 15, 22, totalDays]);
  const points = Array.from({ length: totalDays }, (_, index) => ({
    key: dayKey(monthKeyValue, index + 1),
    label: tickDays.has(index + 1) ? String(index + 1) : "",
    spentCents: 0,
  }));

  for (const t of transactions) {
    if (t.excludeFromBudget || t.isIncome) continue;
    if (monthKeyOf(t.occurredAt) !== monthKeyValue) continue;
    const day = new Date(t.occurredAt).getUTCDate();
    points[day - 1].spentCents += -t.amountCents;
  }

  return points;
}

function activeDayKey(points: ReportChartPoint[]): string {
  for (let index = points.length - 1; index >= 0; index -= 1) {
    if (points[index].spentCents > 0) return points[index].key;
  }
  return points[points.length - 1]?.key ?? "";
}

/** Build the full report for a period. `anchorKey` defaults to the latest month
 *  with data (so it tracks the seeded dataset, not a live clock); pass a specific
 *  month to drill the "month" period into that month. */
export function buildTrendsReport(
  transactions: Transaction[],
  period: TrendPeriod,
  anchorKey = latestMonthKey(transactions),
  locale: AppLocale = DEFAULT_LOCALE,
  now = new Date(),
): TrendsReport {
  const keys = periodMonthKeys(period, anchorKey);
  const keySet = new Set(keys);

  const buckets = monthlySpendForKeys(transactions, keys, locale);
  const spendingCents = buckets.reduce((sum, b) => sum + b.spentCents, 0);
  const incomeCents = buckets.reduce((sum, b) => sum + b.incomeCents, 0);

  let txnCount = 0;
  for (const t of transactions) {
    if (t.excludeFromBudget) continue;
    if (keySet.has(monthKeyOf(t.occurredAt))) txnCount += 1;
  }

  // By category (share of window spend), largest first.
  const catMap = categorySpendForKeys(transactions, keySet);
  const byCategory: ReportCategory[] = [...catMap.values()]
    .sort((a, b) => b.cents - a.cents)
    .slice(0, 6)
    .map((c) => ({
      name: c.name,
      emoji: c.emoji,
      cents: c.cents,
      pct: spendingCents > 0 ? (c.cents / spendingCents) * 100 : 0,
    }));

  // Top movers vs the previous equal-length window.
  const prevKeys = new Set(keysEndingAt(shiftMonthKey(keys[0], -1), keys.length));
  const prevMap = categorySpendForKeys(transactions, prevKeys);
  const moverNames = new Set([...catMap.keys(), ...prevMap.keys()]);
  const topMovers: ReportMover[] = [...moverNames]
    .map((name) => ({
      name,
      emoji: catMap.get(name)?.emoji ?? prevMap.get(name)?.emoji ?? "🧾",
      deltaCents: (catMap.get(name)?.cents ?? 0) - (prevMap.get(name)?.cents ?? 0),
    }))
    .filter((m) => m.deltaCents !== 0)
    .sort((a, b) => Math.abs(b.deltaCents) - Math.abs(a.deltaCents))
    .slice(0, 5);

  // Frequent spots — most-visited merchants in the window (expenses only),
  // ranked by visit count (unlike the Home habit widget, no min-span filter).
  const byMerchant = new Map<string, ReportMerchant>();
  for (const t of transactions) {
    if (t.excludeFromBudget || t.isIncome) continue;
    if (!keySet.has(monthKeyOf(t.occurredAt))) continue;
    const existing = byMerchant.get(t.merchant);
    if (existing) {
      existing.cents += -t.amountCents;
      existing.count += 1;
    } else {
      byMerchant.set(t.merchant, {
        name: t.merchant,
        emoji: t.emoji,
        cents: -t.amountCents,
        count: 1,
      });
    }
  }
  const frequentSpots = [...byMerchant.values()]
    .sort((a, b) => b.count - a.count || b.cents - a.cents)
    .slice(0, 5);

  // The single-month report answers a different question from the multi-month
  // windows: once drilled into a month, the chart switches to daily spend so it
  // no longer duplicates the 6/12/YTD monthly bars.
  const chartPoints =
    period === "month"
      ? dailySpendForMonth(transactions, anchorKey)
      : monthlySpendForKeys(transactions, keys).map((bucket) => ({
          key: bucket.key,
          label: bucket.label,
          spentCents: bucket.spentCents,
        }));
  const comparisonKeys =
    period === "month"
      ? [shiftMonthKey(anchorKey, -1)]
      : keysEndingAt(shiftMonthKey(keys[0], -1), keys.length);
  const comparisonThroughDay =
    period === "month" &&
    anchorKey === monthKeyForDate(now) &&
    now.getUTCDate() < daysInMonth(anchorKey)
      ? now.getUTCDate()
      : null;
  const chartPrevSpend =
    comparisonThroughDay === null
      ? monthlySpendForKeys(transactions, comparisonKeys).reduce(
          (sum, bucket) => sum + bucket.spentCents,
          0,
        )
      : spendingThroughDay(transactions, comparisonKeys[0], comparisonThroughDay);
  const chartChangePct = spendChangePercent(spendingCents, chartPrevSpend);
  const chartAxis = buildMoneyAxis(Math.max(0, ...chartPoints.map((point) => point.spentCents)), 2);

  return {
    period,
    periodLabel: PERIOD_LABEL[period],
    rangeLabel: rangeLabel(keys, locale),
    monthsInWindow: keys.length,
    incomeCents,
    spendingCents,
    netCents: incomeCents - spendingCents,
    txnCount,
    byCategory,
    topMovers,
    frequentSpots,
    chart: {
      points: chartPoints,
      granularity: period === "month" ? "day" : "month",
      totalCents: spendingCents,
      changePct: chartChangePct,
      comparisonLabel: chartChangePct === null ? null : rangeLabel(comparisonKeys, locale),
      comparisonThroughDay: chartChangePct === null ? null : comparisonThroughDay,
      yTicks: chartAxis.ticks,
      axisMaxCents: chartAxis.maxCents,
      currentKey: period === "month" ? activeDayKey(chartPoints) : anchorKey,
    },
  };
}
