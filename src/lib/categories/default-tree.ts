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

/** Preview an additive upgrade: retain IDs, budgets, custom definitions and merges.
 * Only the three renamed starter roots and recognized default icons are updated. */
export function addDefaultCategories(
  draft: CategoryTreeDraft,
  createId: () => string,
): CategoryTreeDraft {
  const nodes = draft.nodes.map((node) => ({ ...node }));
  const normalize = (name: string) => name.trim().toLowerCase();
  for (const { children, name, emoji, color } of DEFAULT_CATEGORIES) {
    let parent = nodes.find((node) => !node.parentId && normalize(node.name) === normalize(name));
    if (!parent && legacyNames[name]) {
      parent = nodes.find((node) => !node.parentId && node.name === legacyNames[name]);
      if (parent) parent.name = name;
    }
    if (!parent) {
      parent = { id: createId(), name, emoji, color, parentId: null };
      nodes.push(parent);
    }
    parent.emoji = emoji;
    for (const child of children) {
      const existing = nodes.find(
        (node) => node.parentId === parent.id && normalize(node.name) === normalize(child.name),
      );
      if (existing) existing.emoji = child.emoji;
      else nodes.push({ ...child, color: parent.color, id: createId(), parentId: parent.id });
    }
  }
  return { ...draft, nodes };
}
