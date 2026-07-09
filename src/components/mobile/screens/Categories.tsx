"use client";

import { ChevronRight, SlidersHorizontal } from "lucide-react";
import { useMemo } from "react";
import { MonthStepper } from "@/components/shared/MonthStepper";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { allocation } from "@/lib/budget";
import { formatMoney, spentPercent } from "@/lib/format";
import { categorySpentForMonth, resolveViewMonth } from "@/lib/trends";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

/** Mobile Budget tab — a read-first list of the monthly budget + each category's
 *  allocation / spend / remaining. All editing (total, allocations, add/remove)
 *  happens in the Edit-budget sheet (the repurposed BudgetSetup screen). */
export function Categories() {
  const { user, categories, transactions, viewMonthKey, webBudgets, openCategory, goMobile } =
    useStore(
      useShallow((s) => ({
        user: s.user,
        categories: s.categories,
        transactions: s.transactions,
        viewMonthKey: s.viewMonthKey,
        webBudgets: s.webBudgets,
        openCategory: s.openCategory,
        goMobile: s.goMobile,
      })),
    );

  const monthKey = resolveViewMonth(viewMonthKey, transactions);
  const spentByCat = useMemo(
    () => categorySpentForMonth(transactions, monthKey),
    [transactions, monthKey],
  );
  const { allocated, remaining, percent, over } = allocation(webBudgets, user.budgetPoolCents);

  return (
    <div className="px-4 pt-3">
      <div className="mt-3 flex justify-center">
        <MonthStepper />
      </div>

      {/* Monthly budget summary */}
      <div className="mt-3 rounded-[14px] border border-edge p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-[.05em] text-muted">
              Monthly budget
            </div>
            <div className="mt-1 text-[28px] font-bold leading-none tabular-nums text-ink">
              {formatMoney(user.budgetPoolCents)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => goMobile("budget")}
            className="flex items-center gap-1.5 rounded-[10px] bg-primary px-3 py-2 text-[12.5px] font-semibold text-onprimary"
          >
            <SlidersHorizontal size={14} strokeWidth={2.4} />
            Edit budget
          </button>
        </div>
        <ProgressBar
          percent={percent}
          color={over ? "var(--primary)" : "var(--pos)"}
          height={7}
          className="mt-3.5"
        />
        <div className="mt-2 text-[12px] font-medium text-muted">
          {formatMoney(allocated)} allocated ·{" "}
          <span className={over ? "font-semibold text-primary" : "font-semibold text-green"}>
            {over ? `${formatMoney(-remaining)} over` : `${formatMoney(remaining)} to allocate`}
          </span>
        </div>
      </div>

      <p className="mt-3.5 text-[11px] font-medium text-muted">
        Tap a category for its transactions
      </p>

      {/* Category rows — read-only; tap opens the category's detail. */}
      <div className="mt-2.5 flex flex-col gap-2.5">
        {categories.map((category) => {
          const budget = webBudgets[category.id] ?? 0;
          const spentCents = spentByCat.get(category.id) ?? 0;
          const percentSpent = spentPercent(spentCents, budget);
          const isOver = spentCents > budget;
          const leftCents = budget - spentCents;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => openCategory(category.id)}
              className="rounded-[12px] border border-edge p-3.5 text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-[16px]">{category.emoji}</span>
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink">
                  {category.name}
                </span>
                <span className="text-[12.5px] font-semibold tabular-nums text-ink">
                  {formatMoney(budget)}
                </span>
                <ChevronRight size={15} strokeWidth={2} className="flex-none text-muted" />
              </div>
              <ProgressBar
                percent={percentSpent}
                color={isOver ? "var(--primary)" : category.color}
                height={6}
                className="mt-2.5"
              />
              <div className="mt-1.5 text-[11px] font-medium text-muted">
                {formatMoney(spentCents)} spent ·{" "}
                <span
                  className={isOver ? "font-semibold text-primary" : "font-semibold text-green"}
                >
                  {formatMoney(Math.abs(leftCents))} {isOver ? "over" : "left"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
