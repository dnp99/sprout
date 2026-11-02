import { expect, it } from "vitest";
import { monthSearchBounds } from "./search-dates";
it("uses inclusive month ends including leap years and year boundaries", () => {
  expect(monthSearchBounds("2024-02")).toEqual({ from: "2024-02-01", to: "2024-02-29" });
  expect(monthSearchBounds("2026-02")).toEqual({ from: "2026-02-01", to: "2026-02-28" });
  expect(monthSearchBounds("2026-12")).toEqual({ from: "2026-12-01", to: "2026-12-31" });
  expect(() => monthSearchBounds("2026-13")).toThrow();
});
