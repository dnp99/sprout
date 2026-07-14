"use client";

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { currentMonthKey, monthKeyLabel, resolveViewMonth, shiftMonthKey } from "@/lib/trends";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

/** Prev/next month selector bound to the store's `viewMonthKey`. The single
 *  month-change control — used by the desktop header and every month-scoped
 *  mobile screen (Transactions, Budget). `compact` uses a short "Jul 2026" label
 *  and drops the calendar icon so it fits a narrow slot next to a search bar.
 *
 *  Arrows are a ≥44px tap target on mobile (design system) and shrink on desktop
 *  (`lg:`), where a mouse doesn't need the room. */
export function MonthStepper({
  className = "",
  compact = false,
  showToday = false,
  defaultToCurrent = false,
}: {
  className?: string;
  compact?: boolean;
  /** Expose a reset affordance for views where returning to this month matters. */
  showToday?: boolean;
  /** Bills defaults to the calendar month even when there is no activity yet. */
  defaultToCurrent?: boolean;
}) {
  const { transactions, viewMonthKey, set } = useStore(
    useShallow((s) => ({
      transactions: s.transactions,
      viewMonthKey: s.viewMonthKey,
      set: s.set,
    })),
  );
  const active =
    viewMonthKey ||
    (defaultToCurrent ? currentMonthKey() : resolveViewMonth(viewMonthKey, transactions));
  // Cap navigation at the current month — no viewing future months. ("YYYY-MM"
  // keys compare lexicographically, so a string compare is enough.)
  const atCurrentMonth = active >= currentMonthKey();
  const step = (delta: number) => set({ viewMonthKey: shiftMonthKey(active, delta) });

  const [year, month] = active.split("-").map(Number);
  const label = compact
    ? new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : monthKeyLabel(active);

  return (
    <div
      className={`flex items-center rounded-[10px] border border-edge text-[12.5px] font-semibold text-muted ${className}`}
    >
      <Arrow dir={-1} onClick={() => step(-1)} title={monthKeyLabel(shiftMonthKey(active, -1))} />
      <span
        className={`flex items-center justify-center gap-[7px] whitespace-nowrap px-1 text-center text-ink ${
          compact ? "text-[11px]" : "min-w-[104px]"
        }`}
      >
        {!compact && <Calendar size={14} strokeWidth={2} className="flex-none text-muted" />}
        {label}
      </span>
      <Arrow
        dir={1}
        onClick={() => step(1)}
        title={monthKeyLabel(shiftMonthKey(active, 1))}
        disabled={atCurrentMonth}
      />
      {showToday && !atCurrentMonth && (
        <button
          type="button"
          onClick={() => set({ viewMonthKey: currentMonthKey() })}
          className={`mr-1 rounded-md px-2 font-semibold text-primary transition hover:bg-primary-soft ${
            compact ? "h-8 text-[10.5px]" : "h-8 text-[11px]"
          }`}
        >
          Today
        </button>
      )}
    </div>
  );
}

function Arrow({
  dir,
  onClick,
  title,
  disabled = false,
}: {
  dir: -1 | 1;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}) {
  const Icon = dir < 0 ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir < 0 ? "Previous month" : "Next month"}
      title={disabled ? undefined : title}
      className="flex h-11 w-9 flex-none items-center justify-center rounded-lg text-muted transition hover:bg-track active:bg-track disabled:pointer-events-none disabled:opacity-30 lg:h-8 lg:w-8"
    >
      <Icon size={18} strokeWidth={2} />
    </button>
  );
}
