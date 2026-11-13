import { expect, it } from "vitest";
import { calendarSpendingIntensity } from "./calendar-intensity";
it("keeps zeroes/credits neutral and ranks positive spending without outlier washout", () => {
  const levels = calendarSpendingIntensity([0, -100, 1000, 2000, 9000000]);
  expect(levels.get(0)).toBeUndefined();
  expect(levels.get(-100)).toBeUndefined();
  expect([...levels.values()]).toEqual([1, 2, 3]);
});
it("treats identical days consistently and leaves empty periods neutral", () => {
  expect([...calendarSpendingIntensity([50, 50, 50])]).toEqual([[50, 1]]);
  expect(calendarSpendingIntensity([0, -50, NaN]).size).toBe(0);
});
