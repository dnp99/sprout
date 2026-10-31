import { expect, it } from "vitest";
import { appendAmountKey } from "./amount-entry";

it("builds integer cents and removes one digit at a time", () => {
  expect(["1", "2", "3", "4"].reduce(appendAmountKey, 0)).toBe(1234);
  expect(appendAmountKey(1234, "back")).toBe(123);
  expect(appendAmountKey(50, "00")).toBe(5000);
  expect(appendAmountKey(0, "back")).toBe(0);
});
it("caps appended digits without changing an existing larger amount on invalid input", () => {
  expect(appendAmountKey(9_999_999, "9")).toBe(9_999_999);
  expect(appendAmountKey(9_999_999, "00")).toBe(9_999_999);
  for (const key of [".", "-1", "10", "x", ""]) expect(appendAmountKey(123, key)).toBe(123);
});
