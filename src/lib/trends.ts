import type { TopMover, Transaction, TrendPoint } from "./types";

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
