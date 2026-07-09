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
    months: MonthSpend[];
    totalCents: number;
    changePct: number | null;
    /** Month key to highlight as "current" (the window's anchor). */
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
export function monthlySpendForKeys(transactions: Transaction[], keys: string[]): MonthSpend[] {
  const byKey = new Map<string, MonthSpend>();
  const buckets = keys.map((key) => {
    const [y, m] = key.split("-").map(Number);
    const bucket: MonthSpend = {
      key,
      label: new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
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

const MONTH_SHORT = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
};

/** "Jul 2026" for a single month, "Feb–Jul 2026" / "Nov 2025 – Feb 2026" for a span. */
function rangeLabel(keys: string[]): string {
  if (keys.length === 0) return "";
  const first = keys[0];
  const last = keys[keys.length - 1];
  const [fy] = first.split("-").map(Number);
  const [ly] = last.split("-").map(Number);
  if (keys.length === 1) return `${MONTH_SHORT(first)} ${fy}`;
  if (fy === ly) return `${MONTH_SHORT(first)}–${MONTH_SHORT(last)} ${ly}`;
  return `${MONTH_SHORT(first)} ${fy} – ${MONTH_SHORT(last)} ${ly}`;
}

/** Build the full report for a period. `anchorKey` defaults to the latest month
 *  with data (so it tracks the seeded dataset, not a live clock); pass a specific
 *  month to drill the "month" period into that month. */
export function buildTrendsReport(
  transactions: Transaction[],
  period: TrendPeriod,
  anchorKey = latestMonthKey(transactions),
): TrendsReport {
  const keys = periodMonthKeys(period, anchorKey);
  const keySet = new Set(keys);

  const buckets = monthlySpendForKeys(transactions, keys);
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

  // Chart — the window's months, but always ≥6 months of context for the single
  // "month" period so the bar chart doesn't collapse to one bar.
  const chartKeys = period === "month" ? keysEndingAt(anchorKey, 6) : keys;
  const chartMonths = monthlySpendForKeys(transactions, chartKeys);
  const chartTotalCents = chartMonths.reduce((sum, b) => sum + b.spentCents, 0);
  const chartPrevKeys = keysEndingAt(shiftMonthKey(chartKeys[0], -1), chartKeys.length);
  const chartPrevSpend = monthlySpendForKeys(transactions, chartPrevKeys).reduce(
    (sum, b) => sum + b.spentCents,
    0,
  );

  return {
    period,
    periodLabel: PERIOD_LABEL[period],
    rangeLabel: rangeLabel(keys),
    monthsInWindow: keys.length,
    incomeCents,
    spendingCents,
    netCents: incomeCents - spendingCents,
    txnCount,
    byCategory,
    topMovers,
    frequentSpots,
    chart: {
      months: chartMonths,
      totalCents: chartTotalCents,
      changePct: spendChangePercent(chartTotalCents, chartPrevSpend),
      currentKey: anchorKey,
    },
  };
}
