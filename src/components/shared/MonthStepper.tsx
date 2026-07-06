"use client";

import { monthKeyLabel, resolveViewMonth, shiftMonthKey } from "@/lib/trends";
import { useStore } from "@/state/store";

/** Prev/next month selector bound to the store's `viewMonthKey`. Drives the
 *  month-scoped views (Transactions, Categories) on both web and mobile. */
export function MonthStepper({ className = "" }: { className?: string }) {
  const { transactions, viewMonthKey, set } = useStore();
  const active = resolveViewMonth(viewMonthKey, transactions);

  const step = (delta: number) => set({ viewMonthKey: shiftMonthKey(active, delta) });

  return (
    <div
      className={`flex items-center gap-1 rounded-xl bg-card px-1.5 py-1 text-[12.5px] font-bold text-muted ${className}`}
    >
      <Arrow label="‹" onClick={() => step(-1)} title="Previous month" />
      <span className="min-w-[92px] text-center text-ink">📅 {monthKeyLabel(active)}</span>
      <Arrow label="›" onClick={() => step(1)} title="Next month" />
    </div>
  );
}

function Arrow({ label, onClick, title }: { label: string; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-lg text-muted transition hover:bg-track"
    >
      {label}
    </button>
  );
}
