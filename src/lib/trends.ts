import type { DonutSegment, TopMover, Transaction, TrendPoint } from "./types";

/** Client-side spending analytics for the Trends page, computed from the loaded
 *  transaction set. Internal moves (transfers, card/loan payments) are excluded
 *  so the numbers match the server's budget math. All cents are positive
 *  magnitudes (spend/income), not signed. */

export interface MonthSpend {
  /** "2026-06" — stable sort/lookup key. */
  key: string;
  /** "Jun" — short month label. */
  label: string;
  spentCents: number;
  incomeCents: number;
}

export interface CategorySpend {
  name: string;
  emoji: string;
  cents: number;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function counts(t: Transaction): boolean {
  return !t.excludeFromBudget;
}

/** Aggregate the last `months` calendar months (ending at `now`'s month) into
 *  spend/income buckets. Always returns exactly `months` entries, oldest first,
 *  with zeros for months that have no activity. */
export function monthlyTrend(
  transactions: Transaction[],
  now = new Date(),
  months = 6,
): MonthSpend[] {
  const buckets: MonthSpend[] = [];
  const byKey = new Map<string, MonthSpend>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const bucket: MonthSpend = {
      key: monthKey(d),
      label: d.toLocaleDateString("en-US", { month: "short" }),
      spentCents: 0,
      incomeCents: 0,
    };
    buckets.push(bucket);
    byKey.set(bucket.key, bucket);
  }

  for (const t of transactions) {
    if (!counts(t)) continue;
    const bucket = byKey.get(monthKey(new Date(t.occurredAt)));
    if (!bucket) continue;
    if (t.isIncome) bucket.incomeCents += t.amountCents;
    else bucket.spentCents += -t.amountCents;
  }

  return buckets;
}

/** The month to show by default: the most recent one with spending (so an empty
 *  trailing month doesn't render a blank page), else the last bucket. */
export function defaultTrendKey(months: MonthSpend[]): string {
  for (let i = months.length - 1; i >= 0; i--) {
    if (months[i].spentCents > 0) return months[i].key;
  }
  return months[months.length - 1]?.key ?? "";
}

/** The effective selected month: the stored selection if it's still in range,
 *  otherwise the default. Keeps the chart and the header pill in agreement. */
export function activeTrendKey(months: MonthSpend[], selectedKey: string): string {
  return months.some((m) => m.key === selectedKey) ? selectedKey : defaultTrendKey(months);
}

/** "2026-06" → "June 2026" for headers/pills. */
export function monthKeyLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return "";
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

/** The month key ("2026-06") a transaction occurred in. */
export function monthKeyOf(occurredAt: string): string {
  return monthKey(new Date(occurredAt));
}

/** The most recent month that has any transaction, or the current month if the
 *  set is empty. Used as the default "view month". */
export function latestMonthKey(transactions: Transaction[]): string {
  let max = "";
  for (const t of transactions) {
    const k = monthKey(new Date(t.occurredAt));
    if (k > max) max = k;
  }
  return max || monthKey(new Date());
}

/** Step a month key by `delta` months (handles year rollover). */
export function shiftMonthKey(key: string, delta: number): string {
  const [year, month] = key.split("-").map(Number);
  return monthKey(new Date(year, month - 1 + delta, 1));
}

/** The effective view month: the stored selection, else the latest month with
 *  data. Keeps the selector and every month-scoped view in agreement. */
export function resolveViewMonth(viewMonthKey: string, transactions: Transaction[]): string {
  return viewMonthKey || latestMonthKey(transactions);
}

/** Spend + income totals for one month (internal moves excluded). */
export function monthTotals(
  transactions: Transaction[],
  monthKeyValue: string,
): { spentCents: number; incomeCents: number } {
  let spentCents = 0;
  let incomeCents = 0;
  for (const t of transactions) {
    if (t.excludeFromBudget) continue;
    if (monthKey(new Date(t.occurredAt)) !== monthKeyValue) continue;
    if (t.isIncome) incomeCents += t.amountCents;
    else spentCents += -t.amountCents;
  }
  return { spentCents, incomeCents };
}

export interface MerchantSpend {
  name: string;
  emoji: string;
  /** Total spent at this merchant within the window. */
  cents: number;
  /** Number of visits (transactions) within the window. */
  count: number;
  /** Days between the first and last visit in the window. */
  spanDays: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** Rolling window we look back over for a spending habit. */
const HABIT_WINDOW_DAYS = 30;
/** A merchant is a "habit" only once you've been this many times… */
const HABIT_MIN_VISITS = 3;
/** …and those visits stretch across at least this many days (the user's
 *  "at least 2 weeks" rule) — so a single weekend cluster doesn't count. */
const HABIT_MIN_SPAN_DAYS = 14;

interface MerchantAccum {
  name: string;
  emoji: string;
  cents: number;
  count: number;
  firstMs: number;
  lastMs: number;
}

/** Merchants you've visited *frequently and repeatedly* in the last
 *  {@link HABIT_WINDOW_DAYS} days — the "you go to X a lot" nudge. Ranked by
 *  visit count (not spend), and a merchant only qualifies once it clears
 *  {@link HABIT_MIN_VISITS} visits spanning {@link HABIT_MIN_SPAN_DAYS}+ days,
 *  so an occasional splurge is filtered out but a daily-coffee / weekly-takeout
 *  habit surfaces. The window is anchored to the most recent transaction (not a
 *  live clock) so the panel is stable and testable. Internal moves + income
 *  excluded. */
export function topRecurringMerchants(transactions: Transaction[], limit = 5): MerchantSpend[] {
  const spend = transactions.filter((t) => !t.excludeFromBudget && !t.isIncome);
  if (spend.length === 0) return [];

  // Anchor the rolling window to the latest transaction we have.
  const anchorMs = Math.max(...spend.map((t) => new Date(t.occurredAt).getTime()));
  const windowStartMs = anchorMs - HABIT_WINDOW_DAYS * DAY_MS;

  const byName = new Map<string, MerchantAccum>();
  for (const t of spend) {
    const ms = new Date(t.occurredAt).getTime();
    if (ms < windowStartMs) continue;
    const existing = byName.get(t.merchant);
    if (existing) {
      existing.cents += -t.amountCents;
      existing.count += 1;
      existing.firstMs = Math.min(existing.firstMs, ms);
      existing.lastMs = Math.max(existing.lastMs, ms);
    } else {
      byName.set(t.merchant, {
        name: t.merchant,
        emoji: t.emoji,
        cents: -t.amountCents,
        count: 1,
        firstMs: ms,
        lastMs: ms,
      });
    }
  }

  return (
    [...byName.values()]
      .map((m) => ({
        name: m.name,
        emoji: m.emoji,
        cents: m.cents,
        count: m.count,
        spanDays: Math.round((m.lastMs - m.firstMs) / DAY_MS),
      }))
      .filter((m) => m.count >= HABIT_MIN_VISITS && m.spanDays >= HABIT_MIN_SPAN_DAYS)
      // Most-frequent first; ties broken by higher spend.
      .sort((a, b) => b.count - a.count || b.cents - a.cents)
      .slice(0, limit)
  );
}

/** Per-category expense spend for one month, keyed by `categoryId` (null for
 *  uncategorized). Internal moves and income excluded. */
export function categorySpentForMonth(
  transactions: Transaction[],
  monthKeyValue: string,
): Map<string | null, number> {
  const map = new Map<string | null, number>();
  for (const t of transactions) {
    if (t.excludeFromBudget || t.isIncome) continue;
    if (monthKey(new Date(t.occurredAt)) !== monthKeyValue) continue;
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + -t.amountCents);
  }
  return map;
}

/** Bar heights as a % of the tallest month's spend; the selected month is
 *  flagged `current`. A month with any spend gets a small floor so its bar is
 *  visible. */
export function toTrendPoints(months: MonthSpend[], selectedKey: string): TrendPoint[] {
  const max = Math.max(1, ...months.map((m) => m.spentCents));
  return months.map((m) => ({
    label: m.label,
    heightPercent: m.spentCents > 0 ? Math.max(4, Math.round((m.spentCents / max) * 100)) : 0,
    current: m.key === selectedKey,
  }));
}

/** Percent change of `current` vs `previous` spend, rounded. Null when there's
 *  no previous month or it was zero (no meaningful baseline). */
export function spendChangePercent(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Expense totals per category for one month, largest first. */
export function categoryBreakdown(
  transactions: Transaction[],
  monthKeyValue: string,
): CategorySpend[] {
  const byName = new Map<string, CategorySpend>();
  for (const t of transactions) {
    if (!counts(t) || t.isIncome) continue;
    if (monthKey(new Date(t.occurredAt)) !== monthKeyValue) continue;
    const existing = byName.get(t.categoryName);
    if (existing) existing.cents += -t.amountCents;
    else
      byName.set(t.categoryName, { name: t.categoryName, emoji: t.emoji, cents: -t.amountCents });
  }
  return [...byName.values()].sort((a, b) => b.cents - a.cents);
}

// Fallback ring color for a category with no color (e.g. "Uncategorized").
const DONUT_FALLBACK = "#e6d2b8";
// Color for the grouped "everything else" slice.
const DONUT_OTHER = "#d8c3a5";

/** Turn a month's category breakdown into donut ring segments, coloring each by
 *  the category's own accent and grouping the long tail past `maxSlices` into a
 *  single "other" slice. Percentages are exact shares of the month's spend (they
 *  sum to ~100); returns [] when there's nothing to show. */
export function toDonutSegments(
  breakdown: CategorySpend[],
  colorByName: Map<string, string>,
  maxSlices = 5,
): DonutSegment[] {
  const total = breakdown.reduce((sum, c) => sum + c.cents, 0);
  if (total <= 0) return [];

  const segments: DonutSegment[] = breakdown.slice(0, maxSlices).map((c) => ({
    color: colorByName.get(c.name) ?? DONUT_FALLBACK,
    pct: (c.cents / total) * 100,
  }));

  const restCents = breakdown.slice(maxSlices).reduce((sum, c) => sum + c.cents, 0);
  if (restCents > 0) segments.push({ color: DONUT_OTHER, pct: (restCents / total) * 100 });

  return segments;
}

/** Biggest per-category spend changes between two months, largest absolute
 *  delta first, capped at `limit`. Positive delta = spent more this month. */
export function topMovers(
  transactions: Transaction[],
  monthKeyValue: string,
  previousKey: string,
  limit = 3,
): TopMover[] {
  const cur = new Map(categoryBreakdown(transactions, monthKeyValue).map((c) => [c.name, c]));
  const prev = new Map(categoryBreakdown(transactions, previousKey).map((c) => [c.name, c.cents]));
  const names = new Set<string>([...cur.keys(), ...prev.keys()]);

  const movers: TopMover[] = [];
  for (const name of names) {
    const deltaCents = (cur.get(name)?.cents ?? 0) - (prev.get(name) ?? 0);
    if (deltaCents === 0) continue;
    movers.push({ name, emoji: cur.get(name)?.emoji ?? "🧾", deltaCents });
  }
  return movers.sort((a, b) => Math.abs(b.deltaCents) - Math.abs(a.deltaCents)).slice(0, limit);
}
