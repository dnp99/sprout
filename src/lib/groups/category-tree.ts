import type { GroupCategory } from "./dto";
import { GroupError } from "./validation";

export type CategoryNode = Pick<GroupCategory, "id" | "name" | "emoji" | "color"> & {
  parentId: string | null;
};
export interface CategoryTreeDraft {
  nodes: CategoryNode[];
  merges: { sourceId: string; targetId: string }[];
}
/** Explicit parent paths keep imported/exported and selected subcategories unambiguous. */
export function groupCategoryLabel(categories: GroupCategory[], id: string | null) {
  const node = categories.find((c) => c.id === id);
  if (!node) return "";
  const parent = categories.find((c) => c.id === node.parentId);
  return parent ? `${parent.name} / ${node.name}` : node.name;
}
/** Stable tree order is shared by every group category picker and budget list. */
export function orderGroupCategories<T extends GroupCategory>(categories: T[]): T[] {
  const roots = categories.filter(
    (c) => !c.parentId || !categories.some((p) => p.id === c.parentId),
  );
  return roots.flatMap((root) => [root, ...categories.filter((c) => c.parentId === root.id)]);
}
/** Normalize legacy null parents so undo and conflict comparisons use a stable local snapshot. */
export function categoryTreeDraft(categories: GroupCategory[]): CategoryTreeDraft {
  return {
    nodes: categories
      .filter((c) => !c.archived)
      .map(({ id, name, emoji, color, parentId }) => ({
        id,
        name,
        emoji,
        color,
        parentId: parentId ?? null,
      })),
    merges: [],
  };
}
/** Two-level moves lift existing children to siblings instead of creating a hidden third level. */
export function moveGroupCategory(
  draft: CategoryTreeDraft,
  sourceId: string,
  parentId: string | null,
): CategoryTreeDraft {
  const source = draft.nodes.find((n) => n.id === sourceId),
    parent = draft.nodes.find((n) => n.id === parentId);
  if (!source || (parentId && (!parent || parent.parentId || parent.id === sourceId)))
    throw new GroupError("Choose a different top-level parent.");
  return {
    ...draft,
    nodes: draft.nodes.map((n) =>
      n.id === sourceId
        ? { ...n, parentId }
        : parentId && n.parentId === sourceId
          ? { ...n, parentId }
          : n,
    ),
  };
}
/** Redirect earlier merges too, so the server receives only final surviving destinations. */
export function mergeGroupCategory(
  draft: CategoryTreeDraft,
  sourceId: string,
  targetId: string,
  originalIds: string[],
): CategoryTreeDraft {
  const source = draft.nodes.find((n) => n.id === sourceId),
    target = draft.nodes.find((n) => n.id === targetId);
  if (!source || !target || sourceId === targetId || target.parentId === sourceId)
    throw new GroupError(
      "Choose another category. Promote a child before merging its parent into it.",
    );
  const parentId = target.parentId ?? target.id;
  return {
    nodes: draft.nodes
      .filter((n) => n.id !== sourceId)
      .map((n) => (n.parentId === sourceId ? { ...n, parentId } : n)),
    merges: [
      ...draft.merges.map((m) => (m.targetId === sourceId ? { ...m, targetId } : m)),
      ...(originalIds.includes(sourceId) ? [{ sourceId, targetId }] : []),
    ],
  };
}
/** Validate the complete replacement graph; omitted categories cannot silently disappear. */
export function validateCategoryTree(current: GroupCategory[], draft: CategoryTreeDraft) {
  if (
    !draft.nodes.length ||
    draft.nodes.length > 100 ||
    current.length + draft.nodes.filter((n) => !current.some((c) => c.id === n.id)).length > 500
  )
    throw new GroupError("Keep 1–100 active categories (maximum 500 including history).");
  const nodes = new Map(draft.nodes.map((n) => [n.id, n])),
    merges = new Map(draft.merges.map((m) => [m.sourceId, m.targetId]));
  if (nodes.size !== draft.nodes.length || merges.size !== draft.merges.length)
    throw new GroupError("Duplicate category change.");
  const names = new Set<string>();
  for (const node of draft.nodes) {
    const key = node.name.normalize("NFKC").trim().toLowerCase();
    if (names.has(key)) throw new GroupError("Active category names must be unique.");
    names.add(key);
    if (current.some((c) => c.id === node.id && c.archived) || merges.has(node.id))
      throw new GroupError("An archived or merged category cannot remain active.");
    if (node.parentId) {
      const parent = nodes.get(node.parentId);
      if (!parent || parent.parentId || parent.id === node.id)
        throw new GroupError("Categories support two levels only; choose a top-level parent.");
    }
  }
  validateGroupCategoryNames(draft.nodes.map((n) => ({ ...n, archived: false })));
  for (const category of current.filter((c) => !c.archived))
    if (!nodes.has(category.id) && !merges.has(category.id))
      throw new GroupError("Keep or explicitly merge every current category.");
  for (const [sourceId, targetId] of merges)
    if (
      !current.some((c) => c.id === sourceId && !c.archived) ||
      !nodes.has(targetId) ||
      sourceId === targetId
    )
      throw new GroupError("Invalid category merge.");
}

/** Import accepts short names and paths; reject alias collisions rather than misclassifying a CSV. */
export function validateGroupCategoryNames(categories: GroupCategory[]) {
  const aliases = new Map<string, string>();
  for (const node of categories.filter((c) => !c.archived))
    for (const label of [node.name, groupCategoryLabel(categories, node.id)]) {
      const key = label.normalize("NFKC").trim().toLowerCase();
      if (aliases.has(key) && aliases.get(key) !== node.id)
        throw new GroupError("Category names and paths must be unambiguous.");
      aliases.set(key, node.id);
    }
}
