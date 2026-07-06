"use client";

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

// Neutral full ring when nothing has been spent yet.
const EMPTY_DONUT = [{ color: "#ece3d4", pct: 100 }];

export function Categories() {
  const { categories, transactions, viewMonthKey, goMobile, openCategory } = useStore();

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
    <div className="px-[22px] pt-3">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-extrabold text-ink">Categories 👀</h1>
        <button
          type="button"
          onClick={() => goMobile("trends")}
          className="text-xs font-bold text-primary"
        >
          Trends ›
        </button>
      </div>

      <div className="mt-3.5 flex justify-center">
        <MonthStepper />
      </div>

      <div className="mt-3 flex items-center gap-4 rounded-card bg-card p-5">
        <Donut segments={donutSegments} topLabel="Spent" value={formatMoney(totalSpentCents)} />
        <div>
          <div className="text-[13px] font-extrabold text-ink">{monthLabel} spending</div>
          <div className="mt-1 text-[11.5px] font-semibold text-muted">
            {categories.length} categories · {budgetPercent}% of budget
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => goMobile("history")}
        className="mt-3.5 flex w-full items-center justify-between rounded-[18px] bg-card px-4 py-3.5"
      >
        <span className="text-[13.5px] font-extrabold text-ink">📋 See all transactions</span>
        <span className="text-xs font-extrabold text-primary">
          {monthLabel.split(" ")[0] || "This month"} ›
        </span>
      </button>

      <p className="mt-4 text-[11.5px] font-bold text-muted">Tap a category for its transactions</p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {categories.map((category) => {
          const spentCents = spentByCat.get(category.id) ?? 0;
          const percent = spentPercent(spentCents, category.monthlyBudgetCents);
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => openCategory(category.id)}
              className="rounded-tile bg-card p-4 text-left"
            >
              <div className="text-[26px]">{category.emoji}</div>
              <div className="mt-1.5 text-[13.5px] font-extrabold text-ink">{category.name}</div>
              <div className="text-[17px] font-extrabold tabular-nums text-ink">
                {formatMoney(spentCents)}
              </div>
              <ProgressBar percent={percent} color={category.color} className="mt-2" />
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => goMobile("addCat")}
          className="flex min-h-[118px] flex-col items-center justify-center rounded-tile border-2 border-dashed border-edge p-4"
        >
          <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-peach-soft text-2xl text-primary">
            +
          </span>
          <span className="mt-2 text-[12.5px] font-extrabold text-primary-dark">New category</span>
        </button>
      </div>
    </div>
  );
}
