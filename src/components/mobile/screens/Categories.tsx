"use client";

import { Plus } from "lucide-react";
import { useMemo } from "react";
import { MonthStepper } from "@/components/shared/MonthStepper";
import { Donut } from "@/components/ui/Donut";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatMoney, spentPercent } from "@/lib/format";
import {
  categorySpentForMonth,
  monthKeyLabel,
  resolveViewMonth,
  toDonutSegments,
} from "@/lib/trends";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

// Neutral full ring when nothing has been spent yet.
const EMPTY_DONUT = [{ color: "#ece3d4", pct: 100 }];

export function Categories() {
  const { categories, transactions, viewMonthKey, goMobile, openCategory, set } = useStore(
    useShallow((s) => ({
      categories: s.categories,
      transactions: s.transactions,
      viewMonthKey: s.viewMonthKey,
      goMobile: s.goMobile,
      openCategory: s.openCategory,
      set: s.set,
    })),
  );

  const monthKey = resolveViewMonth(viewMonthKey, transactions);
  const spentByCat = useMemo(
    () => categorySpentForMonth(transactions, monthKey),
    [transactions, monthKey],
  );
  const totalSpentCents = useMemo(
    () => [...spentByCat.values()].reduce((sum, c) => sum + c, 0),
    [spentByCat],
  );

  // Donut from per-category spend for the selected month, colored by each
  // category's accent. Includes an "Uncategorized" wedge for spend with no
  // category so the ring accounts for the full center total (not just the named
  // tiles below).
  const donutSegments = useMemo(() => {
    const named = categories.map((c) => ({
      name: c.name,
      emoji: c.emoji,
      cents: spentByCat.get(c.id) ?? 0,
    }));
    const uncategorizedCents = spentByCat.get(null) ?? 0;
    const breakdown = [
      ...named,
      ...(uncategorizedCents > 0
        ? [{ name: "Uncategorized", emoji: "🧾", cents: uncategorizedCents }]
        : []),
    ]
      .filter((c) => c.cents > 0)
      .sort((a, b) => b.cents - a.cents);
    const colorByName = new Map(categories.map((c) => [c.name, c.color]));
    const segments = toDonutSegments(breakdown, colorByName);
    return segments.length > 0 ? segments : EMPTY_DONUT;
  }, [categories, spentByCat]);

  const totalBudgetCents = categories.reduce((sum, c) => sum + c.monthlyBudgetCents, 0);
  const budgetPercent = spentPercent(totalSpentCents, totalBudgetCents);
  const monthLabel = monthKeyLabel(monthKey);

  return (
    <div className="px-4 pt-3">
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-bold tracking-[-.02em] text-ink">Categories</h1>
        <button
          type="button"
          onClick={() => goMobile("trends")}
          className="text-[11.5px] font-semibold text-primary"
        >
          Trends ›
        </button>
      </div>

      <div className="mt-3 flex justify-center">
        <MonthStepper />
      </div>

      <div className="mt-3 flex items-center gap-3.5 rounded-[10px] border border-edge p-3.5">
        <Donut
          segments={donutSegments}
          size={84}
          thickness={14}
          topLabel="Spent"
          value={formatMoney(totalSpentCents)}
        />
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-ink">{monthLabel} spending</div>
          <div className="mt-0.5 text-[11px] font-medium text-muted">
            {categories.length} categories · {budgetPercent}% of budget
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => set({ searchType: "all", txnCategory: "all", mobileScreen: "history" })}
        className="mt-3 flex w-full items-center justify-between rounded-[10px] border border-edge px-3.5 py-3 text-left"
      >
        <span className="text-[12.5px] font-semibold text-ink">See all transactions</span>
        <span className="text-[11.5px] font-semibold text-primary">
          {monthLabel.split(" ")[0] || "This month"} ›
        </span>
      </button>

      <p className="mt-3.5 text-[11px] font-medium text-muted">
        Tap a category for its transactions
      </p>

      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        {categories.map((category) => {
          const spentCents = spentByCat.get(category.id) ?? 0;
          const percent = spentPercent(spentCents, category.monthlyBudgetCents);
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => openCategory(category.id)}
              className="rounded-[10px] border border-edge p-3 text-left"
            >
              <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-track text-[16px] leading-none">
                {category.emoji}
              </span>
              <div className="mt-2 text-[12.5px] font-semibold text-ink">{category.name}</div>
              <div className="mt-0.5 text-[14px] font-bold tabular-nums text-ink">
                {formatMoney(spentCents)}
              </div>
              <ProgressBar percent={percent} color={category.color} height={5} className="mt-2" />
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => goMobile("addCat")}
          className="flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-edge p-3"
        >
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-track text-muted">
            <Plus size={16} strokeWidth={2} />
          </span>
          <span className="text-[12px] font-semibold text-muted">New category</span>
        </button>
      </div>
    </div>
  );
}
