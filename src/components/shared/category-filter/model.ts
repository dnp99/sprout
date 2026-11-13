export interface CategoryFilterNode {
  id: string;
  label: string;
  parentId?: string | null;
  accessibleLabel?: string;
}

/** Index once per supplied list. Missing parents become roots; guarded ancestry
 * also makes stale or malformed client snapshots safe to browse. */
export function categoryFilterIndex<T extends CategoryFilterNode>(items: readonly T[]) {
  const byId = new Map(items.map((item) => [item.id, item]));
  const children = new Map<string, T[]>();
  const roots: T[] = [];
  for (const item of items) {
    if (item.parentId && byId.has(item.parentId) && item.parentId !== item.id) {
      const siblings = children.get(item.parentId) ?? [];
      siblings.push(item);
      children.set(item.parentId, siblings);
    } else roots.push(item);
  }
  const ancestors = (id: string) => {
    const result: string[] = [],
      seen = new Set([id]);
    let parent = byId.get(id)?.parentId;
    while (parent && byId.has(parent) && !seen.has(parent)) {
      seen.add(parent);
      result.push(parent);
      parent = byId.get(parent)?.parentId;
    }
    return result;
  };
  const path = (item: CategoryFilterNode) =>
    item.accessibleLabel ??
    [
      ...ancestors(item.id)
        .reverse()
        .map((id) => byId.get(id)!.label),
      item.label,
    ].join(" / ");
  return { byId, children, roots, ancestors, path };
}
export type CategoryFilterIndex = ReturnType<typeof categoryFilterIndex>;

/** Direct assignment counts remain owned by the ledger. Aggregation changes only
 * branch descriptions, never exact-category selection or search/count scope. */
export function categoryFilterView(
  index: CategoryFilterIndex,
  counts: ReadonlyMap<string, number>,
  activeId: string | readonly string[],
  query: string,
  hideEmpty: boolean,
) {
  const aggregate = new Map<string, number>();
  for (const item of index.byId.values()) {
    const count = counts.get(item.id) ?? 0;
    for (const id of [item.id, ...index.ancestors(item.id)])
      aggregate.set(id, (aggregate.get(id) ?? 0) + count);
  }
  const selected = new Set(
    typeof activeId === "string" ? (activeId === "all" ? [] : [activeId]) : activeId,
  );
  const selectedAncestors = new Set([...selected].flatMap((id) => index.ancestors(id)));
  const normalized = query.normalize("NFKC").trim().toLocaleLowerCase();
  const visible = new Set<string>(),
    searchReveal = new Set<string>();
  for (const item of index.byId.values()) {
    const matches = index.path(item).normalize("NFKC").toLocaleLowerCase().includes(normalized);
    const included = normalized
      ? matches
      : !hideEmpty ||
        (aggregate.get(item.id) ?? 0) > 0 ||
        selected.has(item.id) ||
        selectedAncestors.has(item.id);
    if (!included) continue;
    visible.add(item.id);
    for (const id of index.ancestors(item.id)) {
      visible.add(id);
      if (normalized) searchReveal.add(id);
    }
  }
  return { aggregate, visible, searchReveal, selectedAncestors, selected };
}
