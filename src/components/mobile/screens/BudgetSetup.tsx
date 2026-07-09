"use client";

import { CancelSaveHeader } from "@/components/ui/headers";
import { formatBudgetInput, formatMoney, parseBudgetInput, spentPercent } from "@/lib/format";
import { BUDGET_STEP, useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

export function BudgetSetup() {
  const { user, categories, webBudgets, adjustBudget, setBudgetPool, goMobile } = useStore(
    useShallow((s) => ({
      user: s.user,
      categories: s.categories,
      webBudgets: s.webBudgets,
      adjustBudget: s.adjustBudget,
      setBudgetPool: s.setBudgetPool,
      goMobile: s.goMobile,
    })),
  );
  const back = () => goMobile("home");

  // Envelope model: the pool is the total; categories allocate within it. Compute
  // allocated live from the working copy so the bar reacts as the user adjusts.
  const poolCents = user.budgetPoolCents;
  const allocatedCents = categories.reduce((sum, c) => sum + (webBudgets[c.id] ?? 0), 0);
  const unallocatedCents = poolCents - allocatedCents;
  const allocatedPercent = spentPercent(allocatedCents, poolCents);

  return (
    <div className="px-[22px] pt-3">
      <CancelSaveHeader title="Monthly budget 💰" onCancel={back} onSave={back} />

      <div className="mt-5 rounded-card bg-surface p-5 text-bg">
        <div className="text-xs font-extrabold uppercase text-subtle">Total to budget</div>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="text-[40px] font-extrabold leading-none tracking-tight text-bg/70">
            $
          </span>
          <input
            value={formatBudgetInput(poolCents)}
            onChange={(e) => setBudgetPool(parseBudgetInput(e.target.value))}
            placeholder="0"
            inputMode="decimal"
            autoCapitalize="none"
            spellCheck={false}
            className="w-full bg-transparent text-[40px] font-extrabold leading-none tracking-tight tabular-nums text-bg outline-none placeholder:text-subtle"
          />
        </div>
        <div className="mt-3.5 flex h-2.5 overflow-hidden rounded-full bg-[#5f4e3f]">
          <div className="h-full bg-primary" style={{ width: `${allocatedPercent}%` }} />
        </div>
        <div className="mt-2.5 flex justify-between text-[11.5px] font-semibold text-subtle">
          <span>{formatMoney(allocatedCents)} allocated</span>
          <span className={unallocatedCents < 0 ? "text-primary" : undefined}>
            {unallocatedCents < 0
              ? `${formatMoney(-unallocatedCents)} over`
              : `${formatMoney(unallocatedCents)} left`}
          </span>
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
