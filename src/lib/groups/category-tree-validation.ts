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
      name: text(n.name, 40),
      emoji: text(n.emoji, 32),
      color,
      parentId: n.parentId === null ? null : id(n.parentId),
    };
  });
  const merges = body.merges.map((v) => {
    const m = object(v);
    return { sourceId: id(m.sourceId), targetId: id(m.targetId) };
  });
  return { nodes, merges };
}
