import { expect, it } from "vitest";
import { categoryFilterIndex, categoryFilterView } from "./model";
const nodes = [
  { id: "housing", label: "Housing" },
  { id: "condo", label: "Condo & Maintenance", parentId: "housing" },
  { id: "decor", label: "Furniture & Decor", parentId: "housing" },
  { id: "empty", label: "Home Insurance", parentId: "housing" },
  { id: "food", label: "Food" },
];
const index = categoryFilterIndex(nodes);
const counts = new Map([
  ["condo", 1],
  ["decor", 1],
]);
it("aggregates descendants without altering direct counts", () => {
  const result = categoryFilterView(index, counts, "all", "decor", false);
  expect(result.aggregate.get("housing")).toBe(2);
  expect(counts.get("housing")).toBeUndefined();
  expect([...result.visible]).toEqual(["decor", "housing"]);
  expect([...result.searchReveal]).toEqual(["housing"]);
});
it("matches normalized full paths and includes all descendants when the parent matches", () => {
  const result = categoryFilterView(index, counts, "all", " ＨＯＵＳＩＮＧ ", true);
  expect([...result.visible].sort()).toEqual(["housing", "condo", "decor", "empty"].sort());
});
it("hide-empty preserves selected-at-zero and its ancestors; search ignores hiding", () => {
  const result = categoryFilterView(index, new Map(), "empty", "", true);
  expect([...result.visible].sort()).toEqual(["empty", "housing"]);
  const search = categoryFilterView(index, new Map(), "all", "food", true);
  expect([...search.visible]).toEqual(["food"]);
});
it("handles missing parents and counts every ancestor once", () => {
  const tree = categoryFilterIndex([
    { id: "a", label: "A" },
    { id: "b", label: "B", parentId: "a" },
    { id: "c", label: "C", parentId: "b" },
    { id: "d", label: "D", parentId: "missing" },
  ]);
  expect(tree.roots.map((n) => n.id)).toEqual(["a", "d"]);
  expect(categoryFilterView(tree, new Map([["c", 2]]), "c", "", false).aggregate.get("a")).toBe(2);
  expect(tree.path(tree.byId.get("c")!)).toBe("A / B / C");
});
