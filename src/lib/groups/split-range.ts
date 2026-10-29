import { shiftCalendarDate } from "@/lib/calendar";
import type { GroupEntry } from "./dto";

export interface SplitRange {
  from: string;
  to: string;
}
/** Calendar dates use UTC arithmetic to avoid DST shifts and inclusive-boundary errors. */
export function monthRange(month: string): SplitRange {
  const [year, m] = month.split("-").map(Number);
  return { from: `${month}-01`, to: new Date(Date.UTC(year, m, 0)).toISOString().slice(0, 10) };
}
export function weekRange(day: string): SplitRange {
  const offset = (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7;
  const from = shiftCalendarDate(day, -offset);
  return { from, to: shiftCalendarDate(from, 6) };
}
export function inSplitRanges(day: string, ranges: SplitRange[]): boolean {
  return ranges.some((r) => day >= r.from && day <= r.to);
}
/** A refund family is one calculation unit, including dependencies outside the period. */
export function splitFamily(entries: GroupEntry[], id: string): GroupEntry[] {
  const entry = entries.find((e) => e.id === id);
  const originalId = entry?.refundOf ?? id;
  return entries.filter((e) => !e.voidedAt && (e.id === originalId || e.refundOf === originalId));
}
