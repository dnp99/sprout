export interface CategoryLabelNode {
  id: string;
  name: string;
  parentId?: string | null;
}

/** Paths distinguish repeated child labels (Car / Tickets versus Fun / Tickets). */
export function categoryLabel(
  nodes: readonly CategoryLabelNode[],
  node: CategoryLabelNode,
): string {
  const parent = nodes.find((candidate) => candidate.id === node.parentId);
  return parent ? `${parent.name} / ${node.name}` : node.name;
}

/** Full paths always resolve. Short names resolve only when unique, while root
 * names retain their own meaning even if a child elsewhere shares that name. */
export function categoryIdsByLabel(nodes: readonly CategoryLabelNode[]): Map<string, string> {
  const normalize = (name: string) => name.normalize("NFKC").trim().toLowerCase();
  const counts = new Map<string, number>();
  for (const node of nodes)
    counts.set(normalize(node.name), (counts.get(normalize(node.name)) ?? 0) + 1);
  const result = new Map<string, string>();
  for (const node of nodes) {
    if (counts.get(normalize(node.name)) === 1) result.set(normalize(node.name), node.id);
  }
  for (const node of nodes) result.set(normalize(categoryLabel(nodes, node)), node.id);
  return result;
}
