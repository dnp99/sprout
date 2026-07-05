import type { RecurringItem, UpcomingBill } from "./types";

/** Derive upcoming bills from recurring items. Pure — unit-tested. Money stays
 *  signed cents on recurring items (negative = bill); UpcomingBill amounts are
 *  positive magnitudes. */

const DAY_MS = 24 * 60 * 60 * 1000;

/** English ordinal: 1 -> "1st", 22 -> "22nd". */
export function ordinal(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${suffixes[(v - 20) % 10] ?? suffixes[v] ?? suffixes[0]}`;
}

/** "Monthly · 7th". Only monthly cadence is modeled today. */
export function recurringFrequencyLabel(cadence: string, dayOfMonth: number): string {
  if (cadence === "monthly") return `Monthly · ${ordinal(dayOfMonth)}`;
  return cadence;
}

/** The next date this `dayOfMonth` falls on, at or after `now` (day-granularity).
 *  Clamps to the month's length (e.g. day 31 in a 30-day month → the 30th). */
export function nextDueDate(dayOfMonth: number, now = new Date()): Date {
  const dueOn = (year: number, month: number) => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(dayOfMonth, lastDay));
  };
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let due = dueOn(now.getFullYear(), now.getMonth());
  if (due < startToday) due = dueOn(now.getFullYear(), now.getMonth() + 1);
  return due;
}

/** Whole days from `now` to `date` (day-granularity; 0 = today). */
export function daysUntil(date: Date, now = new Date()): number {
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const b = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

/** "Today" | "Tomorrow" | "in N days". */
export function dueLabel(days: number): string {
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `in ${days} days`;
}

/** Non-paused expense recurring items as upcoming bills, soonest first. */
export function deriveUpcomingBills(
  recurring: RecurringItem[],
  now = new Date(),
  limit = 3,
): UpcomingBill[] {
  return recurring
    .filter((r) => !r.paused && !r.isIncome)
    .map((r) => {
      const days = daysUntil(nextDueDate(r.dayOfMonth, now), now);
      return {
        bill: {
          id: r.id,
          name: r.name,
          emoji: r.emoji,
          dueLabel: dueLabel(days),
          amountCents: Math.abs(r.amountCents),
          urgent: days <= 3,
        },
        days,
      };
    })
    .sort((a, b) => a.days - b.days)
    .slice(0, limit)
    .map((x) => x.bill);
}

/** Total of non-paused monthly bills (expense magnitudes), in cents. */
export function monthlyBillsTotalCents(recurring: RecurringItem[]): number {
  return recurring
    .filter((r) => !r.paused && !r.isIncome)
    .reduce((sum, r) => sum + Math.abs(r.amountCents), 0);
}
