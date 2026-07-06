"use client";

import { useMemo, useState } from "react";
import { AddCategoryForm } from "@/components/shared/AddCategoryForm";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Modal } from "@/components/ui/overlays";
import { allocation } from "@/lib/budget";
import { formatMoney, spentPercent } from "@/lib/format";
import { categorySpentForMonth, resolveViewMonth } from "@/lib/trends";
import { BUDGET_STEP, useStore } from "@/state/store";

const TOTAL_BUDGET = 400000;

export function Categories() {
  const { categories, transactions, viewMonthKey, webBudgets, adjustBudget, setBudget } =
    useStore();
  const { allocated, remaining, percent, over } = allocation(webBudgets, TOTAL_BUDGET);
  const [adding, setAdding] = useState(false);

  const monthKey = resolveViewMonth(viewMonthKey, transactions);
  const spentByCat = useMemo(
    () => categorySpentForMonth(transactions, monthKey),
    [transactions, monthKey],
  );

  return (
    <div className="flex items-start gap-4">
      {adding && (
        <Modal title="New category ✨" onClose={() => setAdding(false)}>
          <div className="mt-4">
            <AddCategoryForm onDone={() => setAdding(false)} />
          </div>
        </Modal>
      )}
      <div className="w-[300px] flex-none rounded-[20px] bg-card p-6">
        <div className="text-xs font-extrabold uppercase text-muted">Monthly budget</div>
        <div className="mt-1 text-[34px] font-extrabold tabular-nums text-ink">
          {formatMoney(TOTAL_BUDGET)}
        </div>
        <ProgressBar
          percent={percent}
          color={over ? "#c25b3a" : "#7e9b6b"}
          height={10}
          className="mt-4"
        />
        <div className="mt-2.5 text-[12.5px] font-bold text-muted">
          {formatMoney(allocated)} allocated
        </div>
        <div className="mt-4 border-t border-track pt-4 text-center">
          <div
            className="text-[30px] font-extrabold tabular-nums"
            style={{ color: over ? "#c25b3a" : "#4f7a3a" }}
          >
            {formatMoney(Math.abs(remaining))}
          </div>
          <div className="mt-0.5 text-xs font-bold text-muted">
            {over ? "over budget" : "to allocate"}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-xl bg-primary px-3.5 py-2 text-[12.5px] font-extrabold text-white"
          >
            + New category
          </button>
        </div>
        {categories.map((category) => {
          const budget = webBudgets[category.id] ?? 0;
          const spentCents = spentByCat.get(category.id) ?? 0;
          const percentSpent = spentPercent(spentCents, budget);
          const isOver = spentCents > budget;
          return (
            <div
              key={category.id}
              className="flex items-center gap-4 rounded-2xl border border-track bg-card px-[18px] py-4"
            >
              <span className="text-2xl">{category.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-extrabold text-ink">{category.name}</span>
                  <span className="text-[11.5px] font-bold text-muted">
                    {formatMoney(spentCents)} spent
                  </span>
                </div>
                <ProgressBar
                  percent={percentSpent}
                  color={isOver ? "#c25b3a" : category.color}
                  height={7}
                  className="mt-2.5"
                />
              </div>
              <div className="flex flex-none items-center gap-2">
                <Stepper label="−" onClick={() => adjustBudget(category.id, -BUDGET_STEP)} />
                <div className="flex items-center rounded-lg bg-track px-2 focus-within:bg-card focus-within:ring-1 focus-within:ring-primary/40">
                  <span className="text-[13px] font-extrabold text-muted">$</span>
                  <BudgetInput cents={budget} onSet={(c) => setBudget(category.id, c)} />
                </div>
                <Stepper label="+" primary onClick={() => adjustBudget(category.id, BUDGET_STEP)} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Editable budget in whole/decimal dollars. Shows the live cents value when not
 *  focused (so steppers reflect); a local buffer while typing. */
function BudgetInput({ cents, onSet }: { cents: number; onSet: (cents: number) => void }) {
  const [text, setText] = useState(String(cents / 100));
  const [editing, setEditing] = useState(false);
  return (
    <input
      value={editing ? text : String(cents / 100)}
      inputMode="decimal"
      onFocus={() => {
        setEditing(true);
        setText(String(cents / 100));
      }}
      onChange={(e) => {
        setText(e.target.value);
        onSet(Math.max(0, Math.round((Number(e.target.value) || 0) * 100)));
      }}
      onBlur={() => setEditing(false)}
      className="w-[64px] bg-transparent py-1.5 text-center text-[15px] font-extrabold tabular-nums text-ink outline-none"
    />
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
      className={`flex h-[30px] w-[30px] items-center justify-center rounded-[9px] text-lg ${
        primary ? "bg-peach-soft text-primary" : "bg-track text-muted"
      }`}
    >
      {label}
    </button>
  );
}
