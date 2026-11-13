import { expect, it } from "vitest";
import { toggleCategorySelection } from "./selection";
it("toggles exact IDs without mutating existing selections and All clears", () => {
  const selected = ["housing"];
  expect(toggleCategorySelection(selected, "decor")).toEqual(["housing", "decor"]);
  expect(toggleCategorySelection(["housing", "decor"], "housing")).toEqual(["decor"]);
  expect(toggleCategorySelection(selected, "all")).toEqual([]);
  expect(selected).toEqual(["housing"]);
});
