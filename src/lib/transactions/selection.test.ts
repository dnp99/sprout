import { expect, it } from "vitest";
import { hiddenSelectionCount } from "./selection";
it("discloses selected records outside search without removing them", () => {
  const selected = new Set(["first", "second"]);
  expect(hiddenSelectionCount(selected, ["second", "third"])).toBe(1);
  expect(hiddenSelectionCount(selected, [])).toBe(2);
  expect(hiddenSelectionCount(selected, ["first", "second"])).toBe(0);
  expect([...selected]).toEqual(["first", "second"]);
});
