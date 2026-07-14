export interface RecurringCalendarDay {
  dateKey: string;
  dayOfMonth: number;
}

/** A stable six-week UTC grid for one calendar month. Empty leading/trailing
 *  cells keep weekday columns fixed across month changes, so the recurring
 *  calendar does not jump vertically when a month happens to need five rows. */
export function recurringCalendarGrid(monthKey: string): Array<RecurringCalendarDay | null> {
  const { year, monthIndex } = parseMonthKey(monthKey);
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const cells: Array<RecurringCalendarDay | null> = Array.from({ length: 42 }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(Date.UTC(year, monthIndex, day));
    cells[first.getUTCDay() + day - 1] = {
      dateKey: date.toISOString().slice(0, 10),
      dayOfMonth: day,
    };
  }
  return cells;
}

function parseMonthKey(monthKey: string): { year: number; monthIndex: number } {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(monthKey);
  if (!match) throw new Error(`Invalid month key: ${monthKey}`);
  return { year: Number(match[1]), monthIndex: Number(match[2]) - 1 };
}
