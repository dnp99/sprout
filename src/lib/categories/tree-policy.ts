import type { GroupCategory } from "@/lib/groups/dto";
import type { CategoryTreeDraft } from "@/lib/groups/category-tree";
import { GroupError } from "@/lib/groups/validation";

/** Only category definitions affect this optimistic revision; daily spending does not. */
export function categoryRevision(
  categories: {
    id: string;
    name: string;
    emoji: string;
    color: string;
    parentId?: string | null;
    sortOrder?: number;
  }[],
): number {
  const value = JSON.stringify(
    [...categories]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((c) => [c.id, c.name, c.emoji, c.color, c.parentId ?? null, c.sortOrder ?? 0]),
  );
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return hash >>> 0;
}
/** A level change must not silently discard classification. Explicit choices
 * are checked on the server too, against the complete authorized record set. */
export function uncategorizedByMove(
  current: GroupCategory[],
  draft: CategoryTreeDraft,
  counts: Record<string, number>,
): Set<string> {
  const moved = draft.nodes.filter((n) =>
    current.some((c) => c.id === n.id && (c.parentId ?? null) !== n.parentId),
  );
  const result = new Set<string>();
  for (const node of moved) {
    const choice = draft.recordChoices?.find((c) => c.categoryId === node.id);
    if (counts[node.id] && !choice)
      throw new GroupError("Choose what happens to the records in each moved category.");
    if (choice?.action === "uncategorize") result.add(node.id);
  }
  return result;
}
