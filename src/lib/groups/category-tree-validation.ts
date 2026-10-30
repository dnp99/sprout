import { CATEGORY_NAME_MAX_LENGTH } from "@/lib/categories/validation";
import { id, object, text, GroupError } from "./validation";
import type { CategoryTreeDraft } from "./category-tree";

/** A complete bounded graph is reviewed in the client and revalidated under the group lock. */
export function parseCategoryTree(value: unknown): CategoryTreeDraft {
  const body = object(value);
  if (
    !Array.isArray(body.nodes) ||
    !body.nodes.length ||
    body.nodes.length > 100 ||
    !Array.isArray(body.merges) ||
    body.merges.length > 100
  )
    throw new GroupError("Invalid category organization.");
  const nodes = body.nodes.map((v) => {
    const n = object(v),
      color = text(n.color, 7);
    if (!/^#[0-9a-f]{6}$/i.test(color)) throw new GroupError("Choose a valid category color.");
    return {
      id: id(n.id),
      name: text(n.name, CATEGORY_NAME_MAX_LENGTH),
      emoji: text(n.emoji, 32),
      color,
      parentId: n.parentId === null ? null : id(n.parentId),
    };
  });
  const merges = body.merges.map((v) => {
    const m = object(v);
    return { sourceId: id(m.sourceId), targetId: id(m.targetId) };
  });
  let recordChoices: CategoryTreeDraft["recordChoices"];
  if (body.recordChoices !== undefined) {
    if (!Array.isArray(body.recordChoices) || body.recordChoices.length > 100)
      throw new GroupError("Check record choices.");
    recordChoices = body.recordChoices.map((v) => {
      const row = object(v);
      if (row.action !== "keep" && row.action !== "uncategorize")
        throw new GroupError("Choose what happens to these records.");
      return { categoryId: id(row.categoryId), action: row.action };
    });
    if (new Set(recordChoices.map((c) => c.categoryId)).size !== recordChoices.length)
      throw new GroupError("Duplicate record choice.");
  }
  return { nodes, merges, ...(recordChoices ? { recordChoices } : {}) };
}
