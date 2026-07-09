"use client";

import { Pencil, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { AddCategoryForm } from "@/components/shared/AddCategoryForm";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Modal } from "@/components/ui/overlays";
import { allocation } from "@/lib/budget";
import { formatMoney, spentPercent } from "@/lib/format";
import { categorySpentForMonth, resolveViewMonth } from "@/lib/trends";
import type { Category } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

export function Categories() {
  const { user, categories, transactions, viewMonthKey, webBudgets, set } = useStore(
    useShallow((s) => ({
      user: s.user,
      categories: s.categories,
      transactions: s.transactions,
      viewMonthKey: s.viewMonthKey,
      webBudgets: s.webBudgets,
      set: s.set,
    })),
  );
  const { allocated, remaining, percent, over } = allocation(webBudgets, user.budgetPoolCents);
  // Per-category detail edit (name/emoji/color); null = closed. The all-in-one
  // "Edit budget" modal is app-level (webEditBudgetOpen), so it can also be
  // opened from Home — see EditBudgetModal.
  const [editing, setEditing] = useState<Category | null>(null);

  const monthKey = resolveViewMonth(viewMonthKey, transactions);
  const spentByCat = useMemo(
    () => categorySpentForMonth(transactions, monthKey),
    [transactions, monthKey],
  );

  return (
    <div className="mt-4">
      {editing && (
        <Modal title="Edit category" onClose={() => setEditing(null)}>
          <div className="mt-4">
            <AddCategoryForm category={editing} onDone={() => setEditing(null)} />
          </div>
        </Modal>
      )}

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => set({ webEditBudgetOpen: true })}
          className="flex items-center gap-1.5 rounded-[9px] bg-primary px-3.5 py-2 text-[12.5px] font-semibold text-onprimary"
        >
          <SlidersHorizontal size={14} strokeWidth={2.4} />
          Edit budget
        </button>
      </div>

      <div className="grid grid-cols-[300px_1fr] items-start gap-[18px]">
        {/* Monthly budget summary card (read-only; edit via the modal) */}
        <div className="rounded-[14px] border border-edge p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
            Monthly budget
          </div>
          <div className="mt-1.5 text-[36px] font-bold tracking-[-0.03em] tabular-nums text-ink">
            {formatMoney(user.budgetPoolCents)}
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

        {/* Category rows — read-only display; amounts are edited in the modal. */}
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
                {/* Pencil opens this category's detail edit (name/emoji/color). */}
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
                      {formatMoney(budget)} budget · {formatMoney(spentCents)} spent
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
