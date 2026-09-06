"use client";

import { Check, ListFilter, PanelLeftClose, PanelLeftOpen } from "lucide-react";

export type TransactionFilterRailItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

/** Shared desktop rail for the currently relevant transaction dimension. It is
 * categories for expenses and income sources for income, so the table never
 * leaves people filtering by a field that cannot apply to the visible rows. */
export function TransactionFilterRail({
  title,
  description,
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
}: {
  title: string;
  description: string;
  allLabel: string;
  items: TransactionFilterRailItem[];
  activeId: string;
  totalCount: number;
  counts: ReadonlyMap<string, number>;
  onSelect: (id: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  collapseLabel: string;
  expandLabel: string;
}) {
  if (collapsed) {
    return (
      <aside className="min-h-0 rounded-[14px] border border-edge bg-card p-1">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={false}
          aria-label={expandLabel}
          title={expandLabel}
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
    <aside className="min-h-0 overflow-y-auto overscroll-contain rounded-[14px] border border-edge bg-card p-2">
      <div className="flex items-start justify-between gap-2 px-2.5 pb-2 pt-1.5">
        <div>
          <div className="text-[13.5px] font-bold text-ink">{title}</div>
          <div className="mt-0.5 text-[11px] text-muted">{description}</div>
        </div>
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={true}
          aria-label={collapseLabel}
          title={collapseLabel}
          className="flex h-8 w-8 flex-none items-center justify-center rounded-[8px] text-muted transition hover:bg-track hover:text-ink"
        >
          <PanelLeftClose size={16} strokeWidth={2} />
        </button>
      </div>

      <RailOption
        label={allLabel}
        count={totalCount}
        active={activeId === "all"}
        icon={<ListFilter size={16} strokeWidth={2} />}
        onClick={() => onSelect("all")}
      />
      {items.map((item) => (
        <RailOption
          key={item.id}
          label={item.label}
          count={counts.get(item.id) ?? 0}
          active={activeId === item.id}
          icon={item.icon}
          onClick={() => onSelect(item.id)}
        />
      ))}
    </aside>
  );
}

function RailOption({
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
