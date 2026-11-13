"use client";
import { useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, ListFilter } from "lucide-react";
import { useTranslations } from "next-intl";
import { useModalFocus } from "@/hooks/useModalFocus";
import {
  CategoryFilterPanel,
  type FilterItem,
} from "@/components/shared/category-filter/CategoryFilterPanel";
import { categoryFilterIndex, categoryFilterView } from "@/components/shared/category-filter/model";
import { useCategoryDisclosure } from "@/components/shared/category-filter/useCategoryDisclosure";
import { CollapsedCategoryRail } from "@/components/shared/category-filter/CollapsedCategoryRail";
import { toggleCategorySelection } from "@/components/shared/category-filter/selection";
import { useHideEmptyCategories } from "@/components/shared/category-filter/preference";
export type TransactionFilterRailItem = FilterItem;

/** One browser for desktop rails and mobile sheets. Ledger adapters retain
 * their exact-filter/count semantics; responsive presentation owns no data API. */
export function TransactionFilterRail({
  title,
  allLabel,
  items,
  activeId,
  totalCount,
  counts,
  onSelect,
  collapsed,
  onToggleCollapsed,
  collapseLabel,
  expandLabel,
  mobile = false,
  selectedIds,
  onSelectionChange,
}: {
  title: string;
  description: string;
  allLabel: string;
  items: FilterItem[];
  activeId: string;
  totalCount: number;
  counts: ReadonlyMap<string, number>;
  onSelect: (id: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  collapseLabel: string;
  expandLabel: string;
  mobile?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}) {
  const t = useTranslations("transactionFilterRail"),
    tx = useTranslations("txns");
  const id = useId(),
    anchor = useRef<HTMLButtonElement>(null);
  const [context, setContext] = useState<string>();
  const [query, setQuery] = useState(""),
    [open, setOpen] = useState(false);
  const [hideEmpty, setHideEmpty] = useHideEmptyCategories();
  const index = useMemo(() => categoryFilterIndex(items), [items]);
  const selection = useMemo(
    () => (selectedIds?.length ? selectedIds : activeId === "all" ? [] : [activeId]),
    [selectedIds, activeId],
  );
  const view = useMemo(
    () => categoryFilterView(index, counts, selection, query, hideEmpty),
    [index, counts, selection, query, hideEmpty],
  );
  const disclosure = useCategoryDisclosure(selection, index.ancestors);
  const selectedLabel =
    selection.length > 1
      ? t("selectedCount", { count: selection.length })
      : !selection.length
        ? allLabel
        : (index.byId.get(selection[0])?.label ?? t("unavailable"));
  const select = (value: string) => {
    if (onSelectionChange) onSelectionChange(toggleCategorySelection(selection, value));
    else onSelect(value);
    // Multi-select applies immediately but keeps the sheet open for more choices.
    if (mobile && (!onSelectionChange || value === "all")) setOpen(false);
  };
  const panel = (
    <CategoryFilterPanel
      title={title}
      allLabel={allLabel}
      index={index}
      view={view}
      disclosure={disclosure}
      activeId={activeId}
      totalCount={totalCount}
      counts={counts}
      query={query}
      onQuery={setQuery}
      hideEmpty={hideEmpty}
      onHideEmpty={setHideEmpty}
      onSelect={select}
      closeLabel={mobile ? tx("close") : collapseLabel}
      mobile={mobile}
      onClose={() => (mobile ? setOpen(false) : onToggleCollapsed())}
    />
  );
  if (mobile)
    return (
      <>
        <button
          ref={anchor}
          type="button"
          className="category-filter-chip"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          title={selectedLabel}
          aria-label={`${title}: ${selectedLabel}`}
          onClick={(event) => {
            setContext(
              event.currentTarget.closest<HTMLElement>("[data-ledger-context]")?.dataset
                .ledgerContext,
            );
            setOpen(true);
          }}
        >
          <ListFilter size={15} className="shrink-0" aria-hidden="true" />
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown size={14} className="shrink-0" />
        </button>
        {open && (
          <CategorySheet id={id} title={title} context={context} onClose={() => setOpen(false)}>
            {panel}
          </CategorySheet>
        )}
      </>
    );
  return (
    <aside
      className={`cozy-transaction-rail category-filter-rail ${collapsed ? "is-collapsed" : ""}`}
      aria-label={title}
    >
      {collapsed ? (
        <>
          <button
            type="button"
            className="category-filter-icon category-filter-expand"
            onClick={onToggleCollapsed}
            aria-label={expandLabel}
            title={expandLabel}
            aria-expanded={false}
          >
            <ChevronRight size={17} />
          </button>
          <button
            type="button"
            className="category-filter-icon"
            title={allLabel}
            aria-label={`${allLabel}: ${totalCount}`}
            aria-pressed={!selection.length}
            onClick={() => select("all")}
          >
            <ListFilter size={16} />
          </button>
          <CollapsedCategoryRail
            index={index}
            view={categoryFilterView(index, counts, selection, "", hideEmpty)}
            onSelect={select}
            onOpenBranch={(id) => {
              onToggleCollapsed();
              disclosure.toggle(id, false);
            }}
          />
        </>
      ) : (
        panel
      )}
    </aside>
  );
}

/** Reuse the existing sheet viewport, back layer, focus trap and scroll lock.
 * The hook restores focus to the opening chip when selection or Escape closes. */
function CategorySheet({
  id,
  title,
  context,
  onClose,
  children,
}: {
  id: string;
  title: string;
  context?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useModalFocus(ref, onClose);
  return createPortal(
    <div
      data-ledger-context={context}
      className="transaction-filter-overlay is-mobile modal-backdrop category-filter-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="transaction-filter-dialog category-filter-sheet rounded-[14px] border border-edge bg-card text-ink shadow-2xl"
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
