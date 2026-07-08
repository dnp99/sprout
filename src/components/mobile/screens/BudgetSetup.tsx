"use client";

import { CancelSaveHeader } from "@/components/ui/headers";
import { formatMoney } from "@/lib/format";
import { BUDGET_STEP, useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

export function BudgetSetup() {
  const { categories, webBudgets, adjustBudget, goMobile } = useStore(
    useShallow((s) => ({
      categories: s.categories,
      webBudgets: s.webBudgets,
      adjustBudget: s.adjustBudget,
      goMobile: s.goMobile,
    })),
  );
  const back = () => goMobile("home");

  return (
    <div className="px-[22px] pt-3">
      <CancelSaveHeader title="Monthly budget 💰" onCancel={back} onSave={back} />

      <div className="mt-5 rounded-card bg-surface p-5 text-bg">
        <div className="text-xs font-extrabold uppercase text-subtle">Total to budget</div>
        <div className="mt-1 text-[40px] font-extrabold tracking-tight tabular-nums">$4,000</div>
        <div className="mt-3.5 flex h-2.5 overflow-hidden rounded-full bg-[#5f4e3f]">
          <div className="h-full bg-primary" style={{ width: "64%" }} />
          <div className="h-full bg-green" style={{ width: "36%" }} />
        </div>
        <div className="mt-2.5 flex justify-between text-[11.5px] font-semibold text-subtle">
          <span>🛍️ $2,570 spending</span>
          <span>🌱 $1,430 savings</span>
        </div>
      </div>

      <h2 className="mt-5 text-[15px] font-extrabold text-ink">Give every dollar a job</h2>
      <div className="mt-3 flex flex-col gap-2.5">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center gap-3 rounded-[18px] bg-card px-4 py-3"
          >
            <span className="text-[22px]">{category.emoji}</span>
            <span className="flex-1 text-[13.5px] font-extrabold text-ink">{category.name}</span>
            <div className="flex items-center gap-3">
              <Stepper label="−" onClick={() => adjustBudget(category.id, -BUDGET_STEP)} />
              <span className="min-w-[52px] text-right text-sm font-extrabold tabular-nums text-ink">
                {formatMoney(webBudgets[category.id] ?? 0)}
              </span>
              <Stepper label="+" primary onClick={() => adjustBudget(category.id, BUDGET_STEP)} />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={back}
        className="mt-6 w-full rounded-[20px] bg-primary py-4 text-center text-[15px] font-extrabold text-white"
      >
        Save budget 🌱
      </button>
    </div>
  );
}

function Stepper({
  label,
  onClick,
  primary,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[26px] w-[26px] items-center justify-center rounded-[9px] text-base ${
        primary ? "bg-peach-soft text-primary" : "bg-track text-muted"
      }`}
    >
      {label}
    </button>
  );
}
