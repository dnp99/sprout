import { expect, it } from "vitest";
import { categoryRevision, uncategorizedByMove } from "./tree-policy";
import { categoryTreeDraft, moveGroupCategory, reorderCategory } from "@/lib/groups/category-tree";
const categories = [
  { id: "a", name: "Home", emoji: "🏠", color: "#123456", archived: false, sortOrder: 0 },
  { id: "b", name: "Food", emoji: "🛒", color: "#123456", archived: false, sortOrder: 1 },
];
it("requires a decision for populated moves and returns only explicit unclassifications", () => {
  const draft = moveGroupCategory(categoryTreeDraft(categories), "b", "a");
  expect(() => uncategorizedByMove(categories, draft, { b: 6 })).toThrow();
  draft.recordChoices = [{ categoryId: "b", action: "keep" }];
  expect([...uncategorizedByMove(categories, draft, { b: 6 })]).toEqual([]);
  draft.recordChoices = [{ categoryId: "b", action: "uncategorize" }];
  expect([...uncategorizedByMove(categories, draft, { b: 6 })]).toEqual(["b"]);
});
it("reorders siblings without triggering transaction moves", () => {
  const draft = reorderCategory(categoryTreeDraft(categories), "b", -1);
  expect(draft.nodes.map((n) => n.id)).toEqual(["b", "a"]);
  expect([...uncategorizedByMove(categories, draft, { b: 6 })]).toEqual([]);
});
it("revisions ignore input order but detect definitions and hierarchy changes", () => {
  expect(categoryRevision(categories)).toBe(categoryRevision([...categories].reverse()));
  expect(categoryRevision(categories)).not.toBe(
    categoryRevision(categories.map((c) => ({ ...c, name: c.name + "!" }))),
  );
});
