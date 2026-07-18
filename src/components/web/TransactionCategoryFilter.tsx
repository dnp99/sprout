"use client";

import { Check, ListFilter, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Category } from "@/lib/types";

/** Desktop category rail for the two-column Transactions workspace. Counts are
 * scoped by the parent to the active date, search, and transaction-type filters
 * so selecting a category never appears to produce a surprising result set. */
export function TransactionCategoryFilter({
  categories,
  activeId,
  totalCount,
  counts,
  onSelect,
  collapsed,
  onToggleCollapsed,
}: {
  categories: Category[];
  activeId: string;
  totalCount: number;
  counts: ReadonlyMap<string, number>;
  onSelect: (categoryId: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const t = useTranslations("txns");

  if (collapsed) {
    return (
      <aside className="min-h-0 rounded-[14px] border border-edge bg-card p-1">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={false}
          aria-label={t("expandCategories")}
          title={t("expandCategories")}
          className={`relative flex h-10 w-full items-center justify-center rounded-[9px] transition ${
            activeId === "all"
              ? "text-muted hover:bg-track hover:text-ink"
              : "bg-primary-soft text-primary"
          }`}
        >
          <PanelLeftOpen size={17} strokeWidth={2} />
          {activeId !== "all" && (
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
          )}
        </button>
      </aside>
    );
  }

  return (
    <aside className="min-h-0 overflow-y-auto rounded-[14px] border border-edge bg-card p-2">
      <div className="flex items-start justify-between gap-2 px-2.5 pb-2 pt-1.5">
        <div>
          <div className="text-[13.5px] font-bold text-ink">{t("categoriesLabel")}</div>
          <div className="mt-0.5 text-[11px] text-muted">{t("chooseCategory")}</div>
        </div>
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={true}
          aria-label={t("collapseCategories")}
          title={t("collapseCategories")}
          className="flex h-8 w-8 flex-none items-center justify-center rounded-[8px] text-muted transition hover:bg-track hover:text-ink"
        >
          <PanelLeftClose size={16} strokeWidth={2} />
        </button>
      </div>

      <CategoryOption
        label={t("allCategories")}
        count={totalCount}
        active={activeId === "all"}
        icon={<ListFilter size={16} strokeWidth={2} />}
        onClick={() => onSelect("all")}
      />
      {categories.map((category) => (
        <CategoryOption
          key={category.id}
          label={category.name}
          count={counts.get(category.id) ?? 0}
          active={activeId === category.id}
          icon={<span className="text-[16px] leading-none">{category.emoji}</span>}
          onClick={() => onSelect(category.id)}
        />
      ))}
    </aside>
  );
}

function CategoryOption({
  label,
  count,
  active,
  icon,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex min-h-11 w-full items-center gap-2.5 rounded-[9px] px-2.5 text-left transition ${
        active ? "bg-primary-soft text-primary" : "text-ink hover:bg-track"
      }`}
    >
      <span className="flex w-5 flex-none items-center justify-center">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">{label}</span>
      <span
        className={`text-[11px] font-semibold tabular-nums ${active ? "text-primary" : "text-muted"}`}
      >
        {count}
      </span>
      {active && <Check size={14} strokeWidth={2.5} className="flex-none" />}
    </button>
  );
}
