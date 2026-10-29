/** Calendar-only UTC arithmetic matches ledger reporting dates and avoids DST
 * shifts. UI labels use UTC explicitly so imported midnight dates stay put. */
export function shiftCalendarDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

/** Monday-first grid includes adjacent dates and only the weeks needed. */
export function calendarDays(month: string): string[] {
  const first = `${month}-01`;
  const date = new Date(`${first}T12:00:00Z`);
  const start = shiftCalendarDate(first, -((date.getUTCDay() + 6) % 7));
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 12));
  const count = Math.ceil((((date.getUTCDay() + 6) % 7) + last.getUTCDate()) / 7) * 7;
  return Array.from({ length: count }, (_, i) => shiftCalendarDate(start, i));
}

export interface CalendarRecord {
  id: string;
  date: string;
  createdAt?: string;
  name: string;
  category: string;
  emoji: string;
  amountCents: number;
  spendingCents: number;
  incomeCents: number;
}

/** Aggregate the domain's already-classified contributions; refunds may make
 * a day negative. Excluded rows remain in the agenda with zero contributions. */
export function calendarTotals(records: CalendarRecord[]) {
  return records.reduce(
    (total, row) => ({
      spendingCents: total.spendingCents + row.spendingCents,
      incomeCents: total.incomeCents + row.incomeCents,
    }),
    { spendingCents: 0, incomeCents: 0 },
  );
}
