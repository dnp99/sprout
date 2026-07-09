"use client";

import { Minus, Pencil, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { AddCategoryForm } from "@/components/shared/AddCategoryForm";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Modal } from "@/components/ui/overlays";
import { allocation } from "@/lib/budget";
import { formatMoney, spentPercent } from "@/lib/format";
import { categorySpentForMonth, resolveViewMonth } from "@/lib/trends";
import type { Category } from "@/lib/types";
import { BUDGET_STEP, useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

export function Categories() {
  const {
    user,
    categories,
    transactions,
    viewMonthKey,
    webBudgets,
    adjustBudget,
    setBudget,
    setBudgetPool,
    set,
  } = useStore(
    useShallow((s) => ({
      user: s.user,
      categories: s.categories,
      transactions: s.transactions,
      viewMonthKey: s.viewMonthKey,
      webBudgets: s.webBudgets,
      adjustBudget: s.adjustBudget,
      setBudget: s.setBudget,
      setBudgetPool: s.setBudgetPool,
      set: s.set,
    })),
  );
  const { allocated, remaining, percent, over } = allocation(webBudgets, user.budgetPoolCents);
  // null = closed, "new" = create modal, a Category = edit that one.
  const [editing, setEditing] = useState<Category | "new" | null>(null);

  const monthKey = resolveViewMonth(viewMonthKey, transactions);
  const spentByCat = useMemo(
    () => categorySpentForMonth(transactions, monthKey),
    [transactions, monthKey],
  );

  return (
    <div className="mt-4">
      {editing && (
        <Modal
          title={editing === "new" ? "New category ✨" : "Edit category ✍️"}
          onClose={() => setEditing(null)}
        >
          <div className="mt-4">
            <AddCategoryForm
              category={editing === "new" ? undefined : editing}
              onDone={() => setEditing(null)}
            />
          </div>
        </Modal>
      )}

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="flex items-center gap-1.5 rounded-[9px] bg-primary px-3.5 py-2 text-[12.5px] font-semibold text-onprimary"
        >
          <Plus size={14} strokeWidth={2.6} />
          New category
        </button>
      </div>

      <div className="grid grid-cols-[300px_1fr] items-start gap-[18px]">
        {/* Monthly budget summary card */}
        <div className="rounded-[14px] border border-edge p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
            Monthly budget
          </div>
          <div className="mt-1.5 flex items-baseline text-[36px] font-bold tracking-[-0.03em] tabular-nums text-ink">
            <span>$</span>
            <PoolInput cents={user.budgetPoolCents} onSet={setBudgetPool} />
          </div>
          <ProgressBar
            percent={percent}
            color={over ? "var(--primary)" : "var(--pos)"}
            height={8}
            className="mt-4"
          />
          <div className="mt-2.5 text-[12px] font-medium text-muted">
            {formatMoney(allocated)} allocated
          </div>
          <div className="mt-4 border-t border-edge pt-4 text-center">
            <div
              className={`text-[28px] font-bold tabular-nums tracking-[-0.02em] ${
                over ? "text-primary" : "text-green"
              }`}
            >
              {formatMoney(Math.abs(remaining))}
            </div>
            <div className="mt-0.5 text-[12px] font-medium text-muted">
              {over ? "over budget" : "to allocate"}
            </div>
          </div>
        </div>

        {/* Category rows */}
        <div className="flex flex-col gap-[11px]">
          {categories.map((category) => {
            const budget = webBudgets[category.id] ?? 0;
            const spentCents = spentByCat.get(category.id) ?? 0;
            const percentSpent = spentPercent(spentCents, budget);
            const isOver = spentCents > budget;
            const leftCents = budget - spentCents;
            return (
              <div
                key={category.id}
                className="flex items-center gap-4 rounded-[14px] border border-edge p-[14px_18px] transition-colors hover:border-soft-border"
              >
                {/* Pencil opens the edit modal for this category. */}
                <button
                  type="button"
                  onClick={() => setEditing(category)}
                  title={`Edit ${category.name}`}
                  aria-label={`Edit ${category.name}`}
                  className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-track text-muted transition-colors hover:text-primary"
                >
                  <Pencil size={13} strokeWidth={2} />
                </button>

                {/* The name + progress area opens this category's transactions for
                    the month — a div-button so it can wrap the progress bar;
                    keyboard-accessible. */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    set({ webView: "transactions", webTxnType: "all", txnCategory: category.id })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      set({ webView: "transactions", webTxnType: "all", txnCategory: category.id });
                    }
                  }}
                  title={`View ${category.name} transactions`}
                  className="min-w-0 flex-1 cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="flex items-center gap-1.5 text-[14px] font-bold text-ink">
                      <span>{category.emoji}</span>
                      {category.name}
                    </span>
                    <span className="text-[12px] font-medium text-muted">
                      {formatMoney(spentCents)} spent
                      {" · "}
                      <span className={`font-semibold ${isOver ? "text-primary" : "text-green"}`}>
                        {formatMoney(Math.abs(leftCents))} {isOver ? "over" : "left"}
                      </span>
                    </span>
                  </div>
                  <ProgressBar
                    percent={percentSpent}
                    color={isOver ? "var(--primary)" : category.color}
                    height={7}
                    className="mt-2.5"
                  />
                </div>

                {/* Budget stepper controls */}
                <div className="flex flex-none items-center gap-2">
                  <Stepper
                    label={<Minus size={15} strokeWidth={2} />}
                    ariaLabel={`Decrease ${category.name} budget`}
                    onClick={() => adjustBudget(category.id, -BUDGET_STEP)}
                  />
                  <div className="flex min-w-[52px] items-center justify-center rounded-lg border border-edge px-3 py-1.5 focus-within:border-primary">
                    <span className="text-[13px] font-semibold text-muted">$</span>
                    <BudgetInput cents={budget} onSet={(c) => setBudget(category.id, c)} />
                  </div>
                  <Stepper
                    label={<Plus size={15} strokeWidth={2} />}
                    ariaLabel={`Increase ${category.name} budget`}
                    primary
                    onClick={() => adjustBudget(category.id, BUDGET_STEP)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Editable monthly budget pool (whole dollars, comma-formatted when idle). */
function PoolInput({ cents, onSet }: { cents: number; onSet: (cents: number) => void }) {
  const [text, setText] = useState(String(cents / 100));
  const [editing, setEditing] = useState(false);
  return (
    <input
      value={editing ? text : (cents / 100).toLocaleString("en-US")}
      inputMode="numeric"
      aria-label="Monthly budget"
      onFocus={() => {
        setEditing(true);
        setText(String(cents / 100));
      }}
      onChange={(e) => {
        const cleaned = e.target.value.replace(/[^0-9.]/g, "");
        setText(cleaned);
        onSet(Math.max(0, Math.round((Number(cleaned) || 0) * 100)));
      }}
      onBlur={() => setEditing(false)}
      className="w-full min-w-0 bg-transparent outline-none"
    />
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
      className="w-[56px] bg-transparent text-center text-[13px] font-semibold tabular-nums text-ink outline-none"
    />
  );
}

function Stepper({
  label,
  ariaLabel,
  onClick,
  primary,
}: {
  label: React.ReactNode;
  ariaLabel: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`flex h-7 w-7 items-center justify-center rounded-lg ${
        primary ? "bg-primary-soft text-primary" : "bg-track text-muted"
      }`}
    >
      {label}
    </button>
  );
}
