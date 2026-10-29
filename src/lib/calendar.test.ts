import { describe, expect, it } from "vitest";
import {
  calendarDays,
  calendarTotals,
  shiftCalendarDate,
  localCalendarDate,
  type CalendarRecord,
} from "./calendar";

describe("everyday ledger calendar", () => {
  it("uses local date fields rather than the UTC day for today", () => {
    // Model a Toronto evening after UTC has already crossed midnight.
    const evening = new Date("2026-10-29T01:00:00Z");
    evening.getFullYear = () => 2026;
    evening.getMonth = () => 9;
    evening.getDate = () => 28;
    expect(localCalendarDate(evening)).toBe("2026-10-28");
    expect(localCalendarDate(new Date(2027, 0, 2, 12))).toBe("2027-01-02");
  });
  it("starts Monday and includes the complete month and adjacent week dates", () => {
    const days = calendarDays("2026-10");
    expect(days).toHaveLength(35);
    expect(days[0]).toBe("2026-09-28");
    expect(days[days.length - 1]).toBe("2026-11-01");
    expect(calendarDays("2028-02")).toContain("2028-02-29");
    expect(calendarDays("2026-03")).toHaveLength(42);
  });
  it("crosses year and DST boundaries without changing calendar days", () => {
    expect(shiftCalendarDate("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftCalendarDate("2026-11-01", -7)).toBe("2026-10-25");
  });
  it("nets refunds into spending and keeps earned income separate in cents", () => {
    const record = (spendingCents: number, incomeCents: number) =>
      ({ spendingCents, incomeCents }) as CalendarRecord;
    expect(
      calendarTotals([record(1200, 0), record(-300, 0), record(0, 5000), record(0, 0)]),
    ).toEqual({ spendingCents: 900, incomeCents: 5000 });
    expect(calendarTotals([record(-300, 0)])).toEqual({ spendingCents: -300, incomeCents: 0 });
  });
});
