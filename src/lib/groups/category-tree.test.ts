import { expect, it } from "vitest";
import {
  categoryTreeDraft,
  groupCategoryLabel,
  orderGroupCategories,
  moveGroupCategory,
  mergeGroupCategory,
  validateCategoryTree,
  validateGroupCategoryNames,
} from "./category-tree";
import { parseOperation } from "./validation";
import { resolveGroupSplit } from "./splits";
const categories = [
  { id: "a", name: "Home", emoji: "🏠", color: "#123456", archived: false },
  { id: "b", name: "Rent", emoji: "🏷️", color: "#123456", archived: false, parentId: "a" },
  { id: "c", name: "Living", emoji: "🏷️", color: "#123456", archived: false },
];
it("moves roots and children in either direction and keeps exactly two levels", () => {
  const initial = categoryTreeDraft(categories);
  const moved = moveGroupCategory(initial, "a", "c");
  expect(moved.nodes.find((n) => n.id === "a")?.parentId).toBe("c");
  expect(moved.nodes.find((n) => n.id === "b")?.parentId).toBe("c");
  expect(() => validateCategoryTree(categories, moved)).not.toThrow();
  const promoted = moveGroupCategory(moved, "b", null);
  expect(promoted.nodes.find((n) => n.id === "b")?.parentId).toBeNull();
  expect(() => moveGroupCategory(initial, "a", "b")).toThrow();
  expect(() => moveGroupCategory(initial, "a", "a")).toThrow();
  expect(initial.nodes.find((n) => n.id === "a")?.parentId).toBeNull();
});
it("merges root/child categories into new categories and redirects chained merges", () => {
  const draft = categoryTreeDraft(categories);
  draft.nodes.push({ id: "new", name: "Household", emoji: "🏷️", color: "#123456", parentId: null });
  const first = mergeGroupCategory(
    draft,
    "a",
    "new",
    categories.map((c) => c.id),
  );
  expect(first.nodes.find((n) => n.id === "b")?.parentId).toBe("new");
  const next = mergeGroupCategory(
    first,
    "b",
    "new",
    categories.map((c) => c.id),
  );
  expect(next.merges).toEqual([
    { sourceId: "a", targetId: "new" },
    { sourceId: "b", targetId: "new" },
  ]);
  const final = mergeGroupCategory(
    next,
    "new",
    "c",
    categories.map((c) => c.id),
  );
  expect(final.merges).toEqual([
    { sourceId: "a", targetId: "c" },
    { sourceId: "b", targetId: "c" },
  ]);
  expect(() => validateCategoryTree(categories, final)).not.toThrow();
  expect(() =>
    mergeGroupCategory(
      categoryTreeDraft(categories),
      "a",
      "b",
      categories.map((c) => c.id),
    ),
  ).toThrow();
});
it("rejects dropped identities, foreign parents, duplicate names, merge cycles and third levels", () => {
  const draft = categoryTreeDraft(categories);
  for (const invalid of [
    { ...draft, nodes: draft.nodes.slice(1) },
    { ...draft, nodes: draft.nodes.map((n) => (n.id === "c" ? { ...n, parentId: "foreign" } : n)) },
    { ...draft, nodes: draft.nodes.map((n) => (n.id === "c" ? { ...n, name: "HOME" } : n)) },
    { ...draft, nodes: draft.nodes.map((n) => (n.id === "c" ? { ...n, parentId: "b" } : n)) },
    { ...draft, merges: [{ sourceId: "foreign", targetId: "a" }] },
    { ...draft, merges: [{ sourceId: "a", targetId: "a" }] },
  ])
    expect(() => validateCategoryTree(categories, invalid)).toThrow();
});
it("orders and labels categories as paths without rewriting stored IDs", () => {
  expect(
    orderGroupCategories([categories[1], categories[2], categories[0]]).map((c) => c.id),
  ).toEqual(["c", "a", "b"]);
  expect(groupCategoryLabel(categories, "b")).toBe("Home / Rent");
  expect(groupCategoryLabel(categories, "a")).toBe("Home");
});
it("inherits a parent's split before group fallback but respects a child's explicit override", () => {
  const fallback = { method: "equal", valid: true, participants: [] };
  const parent = {
    categoryId: "a",
    method: "percentage",
    valid: true,
    participants: [{ memberId: "m", weight: 10000 }],
  };
  const child = { categoryId: "b", ...fallback };
  expect(
    resolveGroupSplit({ categories, splitDefaults: fallback, categorySplits: [parent] }, "b"),
  ).toBe(parent);
  expect(
    resolveGroupSplit(
      { categories, splitDefaults: fallback, categorySplits: [parent, child] },
      "b",
    ),
  ).toBe(child);
});
it("validates complete tree requests including the editor's original revision", () => {
  const id = "11111111-1111-4111-8111-111111111111";
  const request = {
    mutationId: id,
    revision: 2,
    type: "categoryTree",
    expectedRevision: 1,
    draft: {
      nodes: [{ id, name: "Home", emoji: "🏠", color: "#123456", parentId: null }],
      merges: [],
    },
  };
  expect(parseOperation(request).operation).toMatchObject({
    type: "categoryTree",
    expectedRevision: 1,
  });
  expect(() => parseOperation({ ...request, expectedRevision: undefined })).toThrow();
  expect(() =>
    parseOperation({
      ...request,
      draft: { ...request.draft, nodes: [{ ...request.draft.nodes[0], color: "red" }] },
    }),
  ).toThrow();
});

it("rejects ambiguous full-path aliases used by imports and exports", () => {
  expect(() =>
    validateGroupCategoryNames([
      ...categories,
      { id: "collision", name: "Home / Rent", emoji: "🏷️", color: "#123456", archived: false },
    ]),
  ).toThrow();
});
