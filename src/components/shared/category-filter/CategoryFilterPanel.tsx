"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Check, ChevronLeft, Search, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { CategoryBranchTrigger } from "../CategoryBranchTrigger";
import { Popover } from "@/components/ui/Popover";
import type { categoryFilterIndex, categoryFilterView } from "./model";
import type { useCategoryDisclosure } from "./useCategoryDisclosure";

export type FilterItem = {
  id: string;
  label: string;
  icon: ReactNode;
  parentId?: string | null;
  accessibleLabel?: string;
};
export function CategoryFilterPanel({
  title,
  allLabel,
  index,
  view,
  disclosure,
  activeId,
  totalCount,
  counts,
  query,
  onQuery,
  onSelect,
  hideEmpty,
  onHideEmpty,
  closeLabel,
  onClose,
  mobile,
}: {
  title: string;
  allLabel: string;
  index: ReturnType<typeof categoryFilterIndex<FilterItem>>;
  view: ReturnType<typeof categoryFilterView>;
  disclosure: ReturnType<typeof useCategoryDisclosure>;
  activeId: string;
  totalCount: number;
  counts: ReadonlyMap<string, number>;
  query: string;
  onQuery: (query: string) => void;
  onSelect: (id: string) => void;
  hideEmpty: boolean;
  onHideEmpty: (value: boolean) => void;
  closeLabel: string;
  onClose: () => void;
  mobile: boolean;
}) {
  const t = useTranslations("transactionFilterRail"),
    picker = useTranslations("categoryPicker");
  const id = useId(),
    tree = useRef<HTMLDivElement>(null);
  const [preferences, setPreferences] = useState(false);
  const preferencesTrigger = useRef<HTMLButtonElement>(null);
  // Scroll only this tree, once per external selection/reopen. Unrelated counts,
  // month loads and manual disclosure changes never move the surrounding page.
  const selectionPath = [...view.selected]
    .map((id) => id + index.ancestors(id).join("/") + String(index.byId.has(id)))
    .join("|");
  useEffect(() => {
    const container = tree.current;
    const row = container?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!container || !row || !row.getClientRects().length) return;
    const bounds = container.getBoundingClientRect(),
      target = row.getBoundingClientRect();
    if (target.top < bounds.top) container.scrollTop += target.top - bounds.top;
    else if (target.bottom > bounds.bottom) container.scrollTop += target.bottom - bounds.bottom;
  }, [activeId, selectionPath]);
  const option = (item: FilterItem, child = false, parentOnly = false) => (
    <FilterOption
      label={parentOnly ? picker("selectParent", { name: item.label }) : item.label}
      accessibleLabel={
        parentOnly ? picker("selectParent", { name: index.path(item) }) : index.path(item)
      }
      icon={child ? undefined : item.icon}
      count={counts.get(item.id) ?? 0}
      selected={view.selected.has(item.id)}
      onSelect={() => onSelect(item.id)}
      child={child}
    />
  );
  function branch(item: FilterItem, depth = 0): ReactNode {
    if (!view.visible.has(item.id) || depth > index.byId.size) return null;
    const children = index.children.get(item.id) ?? [];
    const expanded =
      view.searchReveal.has(item.id) ||
      (!disclosure.collapsed.has(item.id) &&
        (disclosure.expanded.has(item.id) ||
          view.selectedAncestors.has(item.id) ||
          view.selected.has(item.id)));
    const controls = `${id}-${item.id}`;
    return (
      <li key={item.id}>
        {children.length ? (
          <CategoryBranchTrigger
            label={item.label}
            accessibleLabel={index.path(item)}
            icon={item.icon}
            count={view.aggregate.get(item.id) ?? 0}
            expanded={expanded}
            activeDescendant={
              !expanded && (view.selectedAncestors.has(item.id) || view.selected.has(item.id))
                ? t("activeInside")
                : undefined
            }
            controls={controls}
            onToggle={() => disclosure.toggle(item.id, expanded)}
          />
        ) : (
          option(item, depth > 0)
        )}
        {children.length > 0 && (
          <ul id={controls} hidden={!expanded} className="category-filter-children">
            {(!hideEmpty ||
              query.trim() ||
              (counts.get(item.id) ?? 0) > 0 ||
              view.selected.has(item.id)) && <li>{option(item, true, true)}</li>}
            {children.map((child) => branch(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  }
  return (
    <div
      className="category-filter-panel"
      onKeyDown={(event) => {
        if (preferences && event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          setPreferences(false);
          preferencesTrigger.current?.focus();
        }
      }}
    >
      <header className="category-filter-header">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-body font-semibold text-ink">{title}</h2>
          <div className="flex items-center">
            <Popover className="static" open={preferences} onClose={() => setPreferences(false)}>
              <button
                type="button"
                ref={preferencesTrigger}
                className="category-filter-icon"
                aria-label={t("preferences")}
                title={t("preferences")}
                aria-expanded={preferences}
                onClick={() => setPreferences(!preferences)}
              >
                <SlidersHorizontal size={15} />
              </button>
              {preferences && (
                <div className="category-filter-preferences">
                  <label className="flex min-h-11 cursor-pointer items-center gap-2 text-label">
                    <input
                      type="checkbox"
                      checked={hideEmpty}
                      onChange={(e) => onHideEmpty(e.target.checked)}
                    />
                    {t("hideEmpty")}
                  </label>
                </div>
              )}
            </Popover>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              title={closeLabel}
              className={`category-filter-icon ${mobile ? "" : "category-filter-collapse"}`}
            >
              {mobile ? <X size={17} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </div>
        <label className="category-filter-search">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            aria-label={t("search", { name: title })}
            placeholder={t("search", { name: title.toLocaleLowerCase() })}
          />
          {query && (
            <button type="button" onClick={() => onQuery("")} aria-label={t("clear")}>
              <X size={14} />
            </button>
          )}
        </label>
      </header>
      <div className="category-filter-primary">
        <FilterOption
          label={allLabel}
          icon={<SlidersHorizontal size={16} />}
          count={totalCount}
          selected={!view.selected.size}
          onSelect={() => onSelect("all")}
        />
      </div>
      <div ref={tree} className="category-filter-tree">
        <ul>{index.roots.map((item) => branch(item))}</ul>
        {!view.visible.size && (
          <p role="status" className="px-2 py-4 text-meta text-muted">
            {t("empty")}
          </p>
        )}
      </div>
    </div>
  );
}

function FilterOption({
  label,
  accessibleLabel,
  icon,
  count,
  selected,
  onSelect,
  child = false,
}: {
  label: string;
  accessibleLabel?: string;
  icon?: ReactNode;
  count: number;
  selected: boolean;
  onSelect: () => void;
  child?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={accessibleLabel ?? label}
      title={accessibleLabel ?? label}
      aria-pressed={selected}
      onClick={onSelect}
      className={`category-filter-option ${child ? "is-child" : ""}`}
    >
      {icon && <span className="category-filter-symbol">{icon}</span>}
      <span className="category-filter-label">{label}</span>
      <span className={`category-filter-count ${count ? "has-count" : ""}`}>{count}</span>
      {selected && <Check size={14} className="shrink-0" aria-hidden="true" />}
    </button>
  );
}
