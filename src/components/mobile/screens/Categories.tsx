"use client";

import { Donut } from "@/components/ui/Donut";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatMoney, spentPercent } from "@/lib/format";
import { spendingDonutSegments } from "@/lib/mock/misc";
import { useStore } from "@/state/store";

export function Categories() {
  const { categories, summary, goMobile, openCategory } = useStore();

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

      <div className="mt-4 flex items-center gap-4 rounded-card bg-card p-5">
        <Donut
          segments={spendingDonutSegments}
          topLabel="Spent"
          value={formatMoney(summary.spentCents)}
        />
        <div>
          <div className="text-[13px] font-extrabold text-ink">{summary.monthLabel} spending</div>
          <div className="mt-1 text-[11.5px] font-semibold text-muted">
            {categories.length} categories · 81% of budget
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => goMobile("history")}
        className="mt-3.5 flex w-full items-center justify-between rounded-[18px] bg-card px-4 py-3.5"
      >
        <span className="text-[13.5px] font-extrabold text-ink">
          📋 See all transactions this month
        </span>
        <span className="text-xs font-extrabold text-primary">June ›</span>
      </button>

      <p className="mt-4 text-[11.5px] font-bold text-muted">Tap a category for its transactions</p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {categories.map((category) => {
          const percent = spentPercent(category.spentCents, category.monthlyBudgetCents);
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
                {formatMoney(category.spentCents)}
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
