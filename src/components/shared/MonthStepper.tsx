"use client";

import { Calendar, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { currentMonthKey, resolveViewMonth, shiftMonthKey } from "@/lib/trends";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { useFormatters } from "@/i18n/useFormatters";

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
    <div
      role="group"
      aria-label={disabled ? disabledLabel : "Month selector"}
      className={`flex items-center rounded-[10px] border border-edge text-[12.5px] font-semibold text-muted ${
        disabled ? "bg-track" : ""
      } ${className}`}
    >
      <Arrow
        dir={-1}
        onClick={() => step(-1)}
        title={fmt.monthKey(shiftMonthKey(active, -1))}
        disabled={disabled}
      />
      <span
        className={`flex items-center justify-center gap-[7px] whitespace-nowrap px-1 text-center ${
          disabled ? "min-w-[138px] text-muted" : "text-ink"
        } ${compact ? "text-[11px]" : disabled ? "" : "min-w-[104px]"}`}
      >
        {!compact &&
          (disabled ? (
            <Search size={14} strokeWidth={2} className="flex-none text-muted" />
          ) : (
            <Calendar size={14} strokeWidth={2} className="flex-none text-muted" />
          ))}
        {disabled ? (disabledLabel ?? label) : label}
      </span>
      <Arrow
        dir={1}
        onClick={() => step(1)}
        title={fmt.monthKey(shiftMonthKey(active, 1))}
        disabled={disabled || atCurrentMonth}
      />
      {showToday && !disabled && !atCurrentMonth && (
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
