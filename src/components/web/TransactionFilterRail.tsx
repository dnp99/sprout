"use client";

import { useId, useState } from "react";
import { Check, ChevronDown, ListFilter, PanelLeftClose, PanelLeftOpen } from "lucide-react";

export type TransactionFilterRailItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  parentId?: string | null;
  /** Full path distinguishes children with the same name in tooltips and speech. */
  accessibleLabel?: string;
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
  const listId = useId();
  const [disclosure, setDisclosure] = useState(() => ({ activeId, closed: new Set<string>() }));
  // Reopen the selected child's path when selection changes outside this rail.
  // Adjusting this component's own state during render avoids a stale painted frame.
  if (disclosure.activeId !== activeId) {
    const closed = new Set(disclosure.closed);
    const parentId = items.find((item) => item.id === activeId)?.parentId;
    if (parentId) closed.delete(parentId);
    setDisclosure({ activeId, closed });
  }
  const roots = items.filter((item) => !items.some((parent) => parent.id === item.parentId));
  const options = [
    {
      id: "all",
      accessibleLabel: allLabel,
      label: allLabel,
      count: totalCount,
      icon: <ListFilter size={16} strokeWidth={2} />,
    },
    ...items.map((item) => ({
      ...item,
      count: counts.get(item.id) ?? 0,
    })),
  ];

  if (collapsed) {
    return (
      <aside className="cozy-transaction-rail no-scrollbar min-h-0 overflow-y-auto overscroll-contain rounded-[14px] border border-edge bg-card p-1">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={false}
          aria-label={expandLabel}
          title={expandLabel}
          className="flex h-10 w-full items-center justify-center rounded-[9px] text-muted transition hover:bg-track hover:text-ink"
        >
          <PanelLeftOpen size={17} strokeWidth={2} />
        </button>
        {options.map((option) => (
          <CollapsedRailOption
            key={option.id}
            label={option.accessibleLabel ?? option.label}
            count={option.count}
            active={activeId === option.id}
            icon={option.icon}
            onClick={() => onSelect(option.id)}
          />
        ))}
      </aside>
    );
  }

  return (
    <aside className="cozy-transaction-rail min-h-0 overflow-y-auto overscroll-contain rounded-[14px] border border-edge bg-card p-2">
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
      <ul>
        {roots.map((parent) => {
          const children = items.filter((item) => item.parentId === parent.id);
          const expanded = !disclosure.closed.has(parent.id);
          const childrenId = `${listId}-${parent.id}`;
          return (
            <li key={parent.id}>
              <div className="grid grid-cols-[28px_minmax(0,1fr)] items-center">
                {children.length ? (
                  <button
                    type="button"
                    aria-label={parent.label}
                    aria-expanded={expanded}
                    aria-controls={childrenId}
                    onClick={() =>
                      setDisclosure((previous) => {
                        const next = new Set(previous.closed);
                        if (expanded) next.add(parent.id);
                        else next.delete(parent.id);
                        return { activeId, closed: next };
                      })
                    }
                    className="flex min-h-11 items-center justify-center rounded-[8px] text-muted hover:bg-track focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <ChevronDown
                      size={14}
                      className={`transition-transform motion-reduce:transition-none ${expanded ? "" : "-rotate-90"}`}
                    />
                  </button>
                ) : (
                  <span />
                )}
                <RailOption
                  label={parent.label}
                  accessibleLabel={parent.accessibleLabel}
                  count={counts.get(parent.id) ?? 0}
                  active={activeId === parent.id}
                  icon={parent.icon}
                  onClick={() => onSelect(parent.id)}
                />
              </div>
              {children.length > 0 && (
                <ul
                  id={childrenId}
                  hidden={!expanded}
                  className="ms-[28px] border-s border-edge ps-2"
                >
                  {children.map((child) => (
                    <li key={child.id}>
                      <RailOption
                        label={child.label}
                        accessibleLabel={child.accessibleLabel}
                        count={counts.get(child.id) ?? 0}
                        active={activeId === child.id}
                        icon={child.icon}
                        onClick={() => onSelect(child.id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

/** Collapsed rails remain useful filters, not just a reopen affordance. Labels
 * stay available through the button's accessible name and native tooltip. */
function CollapsedRailOption({
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
      aria-label={`${label}: ${count}`}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      className={`relative mt-1 flex min-h-11 w-full items-center justify-center rounded-[9px] transition ${
        active ? "bg-primary-soft text-primary" : "text-ink hover:bg-track"
      }`}
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      {active && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-primary" />}
    </button>
  );
}

function RailOption({
  label,
  accessibleLabel,
  count,
  active,
  icon,
  onClick,
}: {
  label: string;
  accessibleLabel?: string;
  count: number;
  active: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={accessibleLabel ?? label}
      title={accessibleLabel ?? label}
      aria-pressed={active}
      onClick={onClick}
      className={`grid min-h-11 w-full grid-cols-[20px_minmax(0,1fr)_auto_14px] items-center gap-2 rounded-[9px] px-2.5 text-left transition ${
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
      <Check size={14} strokeWidth={2.5} className={active ? "" : "invisible"} />
    </button>
  );
}
