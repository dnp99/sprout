"use client";

import { monthKeyLabel, resolveViewMonth, shiftMonthKey } from "@/lib/trends";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

/** Prev/next month selector bound to the store's `viewMonthKey`. Drives the
 *  month-scoped views (Transactions, Categories) on both web and mobile.
 *  `compact` shrinks it (short month, smaller arrows, fills its column) so it
 *  can sit in a narrow slot next to the search bar. */
export function MonthStepper({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { transactions, viewMonthKey, set } = useStore(
    useShallow((s) => ({
      transactions: s.transactions,
      viewMonthKey: s.viewMonthKey,
      set: s.set,
    })),
  );
  const active = resolveViewMonth(viewMonthKey, transactions);

  const step = (delta: number) => set({ viewMonthKey: shiftMonthKey(active, delta) });

  // "July 2026" full; "Jul 2026" compact.
  const [year, month] = active.split("-").map(Number);
  const label = compact
    ? new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : `📅 ${monthKeyLabel(active)}`;

  return (
    <div
      className={`flex items-center gap-0.5 rounded-xl bg-card px-1 py-1 text-[12.5px] font-bold text-muted ${className}`}
    >
      <Arrow label="‹" onClick={() => step(-1)} title="Previous month" compact={compact} />
      <span
        className={`text-center text-ink ${compact ? "min-w-0 flex-1 truncate" : "min-w-[92px]"}`}
      >
        {label}
      </span>
      <Arrow label="›" onClick={() => step(1)} title="Next month" compact={compact} />
    </div>
  );
}

function Arrow({
  label,
  onClick,
  title,
  compact,
}: {
  label: string;
  onClick: () => void;
  title: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title}
      className={`flex flex-none items-center justify-center rounded-lg text-muted transition hover:bg-track ${
        compact ? "h-6 w-6 text-base" : "h-7 w-7 text-lg"
      }`}
    >
      {label}
    </button>
  );
}
