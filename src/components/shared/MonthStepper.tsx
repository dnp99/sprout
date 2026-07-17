"use client";

import { currentMonthKey, resolveViewMonth, shiftMonthKey } from "@/lib/trends";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { useFormatters } from "@/i18n/useFormatters";
import { MonthSelector } from "@/components/shared/MonthSelector";

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
  disabled = false,
  disabledLabel,
}: {
  className?: string;
  compact?: boolean;
  /** Expose a reset affordance for views where returning to this month matters. */
  showToday?: boolean;
  /** Bills defaults to the calendar month even when there is no activity yet. */
  defaultToCurrent?: boolean;
  /** Disable month navigation when the owning view is intentionally all-time. */
  disabled?: boolean;
  /** Replaces the month while disabled so the active scope remains explicit. */
  disabledLabel?: string;
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
  const fmt = useFormatters();
  const atCurrentMonth = active >= currentMonthKey();
  const step = (delta: number) => set({ viewMonthKey: shiftMonthKey(active, delta) });

  const [year, month] = active.split("-").map(Number);
  const label = compact
    ? fmt.shortMonthYear(new Date(Date.UTC(year, month - 1, 1)))
    : fmt.monthKey(active);

  return (
    <MonthSelector
      label={disabled ? (disabledLabel ?? label) : label}
      onPrevious={() => step(-1)}
      onNext={() => step(1)}
      previousDisabled={disabled}
      nextDisabled={disabled || atCurrentMonth}
      previousTitle={fmt.monthKey(shiftMonthKey(active, -1))}
      nextTitle={fmt.monthKey(shiftMonthKey(active, 1))}
      compact={compact}
      icon={disabled ? "search" : compact ? "none" : "calendar"}
      muted={disabled}
      ariaLabel={disabled ? disabledLabel : "Month selector"}
      className={className}
      trailing={
        showToday && !disabled && !atCurrentMonth ? (
          <button
            type="button"
            onClick={() => set({ viewMonthKey: currentMonthKey() })}
            className={`mr-1 rounded-md px-2 font-semibold text-primary transition hover:bg-primary-soft ${
              compact ? "h-8 text-[10.5px]" : "h-8 text-[11px]"
            }`}
          >
            Today
          </button>
        ) : undefined
      }
    />
  );
}
