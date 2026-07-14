import { describe, expect, it } from "vitest";
import { recurringCalendarGrid } from "./calendar";

describe("recurringCalendarGrid", () => {
  it("keeps a stable six-week grid and aligns days to UTC weekdays", () => {
    const cells = recurringCalendarGrid("2026-07");
    expect(cells).toHaveLength(42);
    expect(cells.slice(0, 3)).toEqual([null, null, null]);
    expect(cells[3]).toEqual({ dateKey: "2026-07-01", dayOfMonth: 1 });
    expect(cells[33]).toEqual({ dateKey: "2026-07-31", dayOfMonth: 31 });
  });

  it("uses the right number of days for February", () => {
    const cells = recurringCalendarGrid("2026-02");
    expect(cells[0]).toEqual({ dateKey: "2026-02-01", dayOfMonth: 1 });
    expect(cells[27]).toEqual({ dateKey: "2026-02-28", dayOfMonth: 28 });
    expect(cells[28]).toBeNull();
  });
});
