import { DEFAULT_CATEGORIES } from "@/lib/auth/defaultCategories";
import type { CategoryTreeDraft } from "@/lib/groups/category-tree";

/** Allocate parents before children so both SQL writers can insert one valid tree. */
export function buildDefaultCategories(createId: () => string) {
  return DEFAULT_CATEGORIES.flatMap(({ children, ...parent }) => {
    const id = createId();
    return [
      { ...parent, id, parentId: null as string | null },
      ...children.map((child) => ({ ...parent, ...child, id: createId(), parentId: id })),
    ];
  }).map((category, sortOrder) => ({ ...category, sortOrder }));
}

const legacyNames: Record<string, string> = {
  Housing: "Bills & rent",
  Dining: "Dining out",
  Transportation: "Transport",
};

/** Replace the legacy starter structure without replacing its transaction IDs.
 * Canonical/legacy duplicates merge; custom categories survive after defaults. */
export function addDefaultCategories(
  draft: CategoryTreeDraft,
  createId: () => string,
): CategoryTreeDraft {
  let nodes = draft.nodes.map((node) => ({ ...node }));
  const ordered: typeof nodes = [];
  const merges = [...draft.merges];
  const recordChoices = [...(draft.recordChoices ?? [])];
  const normalize = (name: string) => name.trim().toLowerCase();
  for (const { children, name, emoji, color } of DEFAULT_CATEGORIES) {
    let parent = nodes.find((node) => !node.parentId && normalize(node.name) === normalize(name));
    if (!parent && legacyNames[name]) {
      parent = nodes.find(
        (node) => !node.parentId && normalize(node.name) === normalize(legacyNames[name]),
      );
      if (parent) parent.name = name;
    }
    if (!parent) {
      parent = { id: createId(), name, emoji, color, parentId: null };
      nodes.push(parent);
    }
    parent.emoji = emoji;
    const legacy =
      legacyNames[name] &&
      nodes.find(
        (node) =>
          !node.parentId &&
          node.id !== parent.id &&
          normalize(node.name) === normalize(legacyNames[name]),
      );
    if (legacy) {
      for (const child of nodes.filter((node) => node.parentId === legacy.id)) {
        const target = nodes.find(
          (node) => node.parentId === parent.id && normalize(node.name) === normalize(child.name),
        );
        if (target) {
          merges.push({ sourceId: child.id, targetId: target.id });
          nodes = nodes.filter((node) => node.id !== child.id);
        } else {
          child.parentId = parent.id;
          if (!recordChoices.some((choice) => choice.categoryId === child.id))
            recordChoices.push({ categoryId: child.id, action: "keep" });
        }
      }
      merges.push({ sourceId: legacy.id, targetId: parent.id });
      nodes = nodes.filter((node) => node.id !== legacy.id);
    }
    ordered.push(parent);
    for (const child of children) {
      const existing = nodes.find(
        (node) => node.parentId === parent.id && normalize(node.name) === normalize(child.name),
      );
      if (existing) {
        existing.emoji = child.emoji;
        ordered.push(existing);
      } else {
        const fresh = { ...child, color: parent.color, id: createId(), parentId: parent.id };
        nodes.push(fresh);
        ordered.push(fresh);
      }
    }
  }
  const seen = new Set(ordered.map((node) => node.id));
  const combined = [...ordered, ...nodes.filter((node) => !seen.has(node.id))];
  // Pending merges may target an old root; redirect them to its surviving identity.
  const targets = new Map(merges.map((merge) => [merge.sourceId, merge.targetId]));
  const resolvedMerges = merges.map((merge) => {
    let targetId = merge.targetId;
    const visited = new Set<string>();
    while (targets.has(targetId) && !visited.has(targetId)) {
      visited.add(targetId);
      targetId = targets.get(targetId)!;
    }
    return { ...merge, targetId };
  });
  return {
    ...draft,
    nodes: combined,
    merges: resolvedMerges,
    ...(recordChoices.length ? { recordChoices } : {}),
  };
}
