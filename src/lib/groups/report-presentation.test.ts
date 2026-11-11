import { expect, it } from "vitest";
import { futureReportPoints } from "./report-presentation";
import type { Transaction } from "@/lib/types";
const row = (date: string, extra = {}) =>
  ({
    occurredAt: date + "T12:00:00Z",
    amountCents: -1000,
    isIncome: false,
    ...extra,
  }) as Transaction;
it("uses UTC financial days and marks only existing future-dated points", () => {
  const rows = [
    row("2026-11-11"),
    row("2026-11-12"),
    row("2026-12-01"),
    row("2026-11-13", { excludeFromBudget: true }),
    row("2026-11-14", { isIncome: true }),
  ];
  const now = new Date("2026-11-11T23:59:59Z");
  expect(futureReportPoints(rows, ["2026-11-11", "2026-11-12", "2026-11-14"], now)).toEqual({
    count: 2,
    keys: ["2026-11-12"],
  });
  expect(futureReportPoints(rows, ["2026-11", "2026-12"], now)).toEqual({
    count: 3,
    keys: ["2026-11", "2026-12"],
  });
  expect(futureReportPoints(rows, ["2026-10"], now)).toEqual({ count: 0, keys: [] });
  expect(rows[1].amountCents).toBe(-1000);
});
