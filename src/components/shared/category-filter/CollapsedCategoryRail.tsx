"use client";
import { useLayoutEffect, useRef } from "react";
import { Check, CircleDot, ListFilter } from "lucide-react";
import type { categoryFilterIndex, categoryFilterView } from "./model";
import type { FilterItem } from "./CategoryFilterPanel";

/** A collapsed rail remains a usable category browser. Branches reopen their
 * full hierarchy; selected children stay directly reachable as compact icons. */
export function CollapsedCategoryRail({
  index,
  view,
  onSelect,
  onOpenBranch,
}: {
  index: ReturnType<typeof categoryFilterIndex<FilterItem>>;
  view: ReturnType<typeof categoryFilterView>;
  onSelect: (id: string) => void;
  onOpenBranch: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const selectedKey = [...view.selected].join("\u0000");
  useLayoutEffect(() => {
    const container = ref.current;
    const selected = container?.querySelector<HTMLElement>('[data-exact-selected="true"]');
    if (!container || !selected) return;
    const box = container.getBoundingClientRect(),
      target = selected.getBoundingClientRect();
    if (target.top < box.top) container.scrollTop += target.top - box.top;
    else if (target.bottom > box.bottom) container.scrollTop += target.bottom - box.bottom;
  }, [selectedKey]);
  const icon = (item: FilterItem) => {
    const branch = !!index.children.get(item.id)?.length;
    const selected = view.selected.has(item.id),
      descendant = view.selectedAncestors.has(item.id);
    return (
      <button
        key={item.id}
        type="button"
        className="category-filter-compact-option"
        aria-label={index.path(item)}
        title={index.path(item)}
        aria-pressed={branch ? undefined : selected}
        aria-expanded={branch ? false : undefined}
        data-selected={selected || descendant}
        data-exact-selected={selected}
        onClick={() => (branch ? onOpenBranch(item.id) : onSelect(item.id))}
      >
        <span className="category-filter-symbol">{item.icon ?? <ListFilter size={16} />}</span>
        {selected ? (
          <Check className="category-filter-compact-marker" size={10} aria-hidden="true" />
        ) : descendant ? (
          <CircleDot className="category-filter-compact-marker" size={10} aria-hidden="true" />
        ) : null}
      </button>
    );
  };
  return (
    <div ref={ref} className="category-filter-compact-list">
      {index.roots
        .filter((item) => view.visible.has(item.id))
        .map((root) => (
          <div key={root.id}>
            {icon(root)}
            {[...view.selected]
              .filter((id) => index.ancestors(id).includes(root.id))
              .map((id) => {
                const child = index.byId.get(id);
                return child ? icon(child) : null;
              })}
          </div>
        ))}
    </div>
  );
}
