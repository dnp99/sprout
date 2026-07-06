import type { Cadence, RecurringItem, UpcomingBill } from "./types";

/** Derive upcoming bills from recurring items. Pure — unit-tested. Money stays
 *  signed cents on recurring items (negative = bill); UpcomingBill amounts are
 *  positive magnitudes. */

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// prettier-ignore
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** English ordinal: 1 -> "1st", 22 -> "22nd". */
export function ordinal(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${suffixes[(v - 20) % 10] ?? suffixes[v] ?? suffixes[0]}`;
}

/** The cadence + anchor fields the schedule helpers need. Anchors are optional
 *  so callers can pass just the ones a cadence uses; missing ones default. */
export interface RecurringSchedule {
  cadence: Cadence;
  dayOfMonth?: number;
  dayOfWeek?: number | null;
  monthOfYear?: number | null;
}

/** "Monthly · 7th" / "Weekly · Tuesdays" / "Yearly · Mar 15". */
export function recurringFrequencyLabel(item: RecurringSchedule): string {
  if (item.cadence === "weekly") {
    return `Weekly · ${WEEKDAYS[item.dayOfWeek ?? 0] ?? "Sunday"}s`;
  }
  if (item.cadence === "yearly") {
    return `Yearly · ${MONTHS[(item.monthOfYear ?? 1) - 1] ?? "Jan"} ${item.dayOfMonth ?? 1}`;
  }
  return `Monthly · ${ordinal(item.dayOfMonth ?? 1)}`;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** A day-of-month in a given month, clamped to the month's length (e.g. day 31
 *  in a 30-day month → the 30th). */
function dayOfMonthIn(year: number, month: number, dayOfMonth: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(dayOfMonth, lastDay));
}

/** The next date this recurring item is due, at or after `now`
 *  (day-granularity), honoring its cadence. */
export function nextDueDate(item: RecurringSchedule, now = new Date()): Date {
  const today = startOfDay(now);

  if (item.cadence === "weekly") {
    const target = (((item.dayOfWeek ?? 0) % 7) + 7) % 7;
    const delta = (target - today.getDay() + 7) % 7; // 0..6; 0 = today
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() + delta);
  }

  const dayOfMonth = item.dayOfMonth ?? 1;
  if (item.cadence === "yearly") {
    const month = (item.monthOfYear ?? 1) - 1;
    let due = dayOfMonthIn(today.getFullYear(), month, dayOfMonth);
    if (due < today) due = dayOfMonthIn(today.getFullYear() + 1, month, dayOfMonth);
    return due;
  }

  // monthly
  let due = dayOfMonthIn(today.getFullYear(), today.getMonth(), dayOfMonth);
  if (due < today) due = dayOfMonthIn(today.getFullYear(), today.getMonth() + 1, dayOfMonth);
  return due;
}

/** A recurring amount expressed as a per-month equivalent (weekly ×52/12,
 *  yearly ÷12, monthly ×1), so a mixed-cadence bills total stays meaningful. */
export function monthlyEquivalentCents(cadence: Cadence, magnitudeCents: number): number {
  if (cadence === "weekly") return Math.round((magnitudeCents * 52) / 12);
  if (cadence === "yearly") return Math.round(magnitudeCents / 12);
  return magnitudeCents;
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
      const days = daysUntil(nextDueDate(r, now), now);
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

/** Total of non-paused bills as a monthly-equivalent (weekly/yearly normalized),
 *  in cents. */
export function monthlyBillsTotalCents(recurring: RecurringItem[]): number {
  return recurring
    .filter((r) => !r.paused && !r.isIncome)
    .reduce((sum, r) => sum + monthlyEquivalentCents(r.cadence, Math.abs(r.amountCents)), 0);
}
