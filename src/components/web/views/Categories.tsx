"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { AddCategoryForm } from "@/components/shared/AddCategoryForm";
import { CategoryDetailPanel } from "@/components/shared/CategoryDetailPanel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Modal } from "@/components/ui/overlays";
import { buildBudgetTrackingView, type BudgetGroup } from "@/lib/budget-view";
import { formatMoney } from "@/lib/format";
import { filterTransactions, sortTransactions } from "@/lib/search";
import { resolveViewMonth } from "@/lib/trends";
import type { Category } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { useFormatters } from "@/i18n/useFormatters";

export function Categories() {
  const fmt = useFormatters();
  const { user, categories, recurring, transactions, viewMonthKey, webBudgets, set } = useStore(
    useShallow((s) => ({
      user: s.user,
      categories: s.categories,
      recurring: s.recurring,
      transactions: s.transactions,
      viewMonthKey: s.viewMonthKey,
      webBudgets: s.webBudgets,
      set: s.set,
    })),
  );
  const [editing, setEditing] = useState<Category | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const monthKey = resolveViewMonth(viewMonthKey, transactions);
  const view = useMemo(
    () =>
      buildBudgetTrackingView({
        totalBudgetCents: user.budgetPoolCents,
        budgets: webBudgets,
        categories,
        recurring,
        transactions,
        monthKey,
      }),
    [user.budgetPoolCents, webBudgets, categories, recurring, transactions, monthKey],
  );
  const selectedCategory = selectedCategoryId
    ? categories.find((category) => category.id === selectedCategoryId)
    : null;
  const selectedRow = selectedCategoryId
    ? view.groups
        .flatMap((group) => group.rows)
        .find((row) => row.categoryId === selectedCategoryId)
    : null;
  const selectedTransactions = selectedCategoryId
    ? sortTransactions(
        filterTransactions(transactions, { categoryId: selectedCategoryId, monthKey }),
        "date",
        "desc",
      )
    : [];

  return (
    <div className="mt-4">
      {editing && (
        <Modal title="Edit category" onClose={() => setEditing(null)}>
          <div className="mt-4">
            <AddCategoryForm category={editing} onDone={() => setEditing(null)} />
          </div>
        </Modal>
      )}

      {selectedCategory && selectedRow ? (
        <CategoryDetailPanel
          category={selectedCategory}
          spentCents={selectedRow.spentCents}
          budgetCents={selectedRow.budgetCents}
          transactions={selectedTransactions}
          onBack={() => setSelectedCategoryId(null)}
          onEdit={() => setEditing(selectedCategory)}
          onOpenTransaction={(id) => set({ webEditTxnId: id })}
        />
      ) : (
        <div className="grid grid-cols-[320px_1fr] items-start gap-[18px]">
          <div className="rounded-[14px] border border-edge bg-card p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
              Monthly budget
            </div>
            <div className="mt-1.5 text-[36px] font-bold tracking-[-0.03em] tabular-nums text-ink">
              {formatMoney(view.budgetCents)}
            </div>
            <div className="mt-1.5 text-[12px] font-medium text-muted">
              Tracking {fmt.monthKey(monthKey)}
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-[12px] font-medium text-muted">
                <span>Allocated</span>
                <span className={view.overAllocated ? "text-primary" : "text-green"}>
                  {formatMoney(view.allocatedCents)}
                </span>
              </div>
              <ProgressBar
                percent={view.allocationPercent}
                color={view.overAllocated ? "var(--primary)" : "var(--pos)"}
                height={8}
                className="mt-2"
              />
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-[12px] font-medium text-muted">
                <span>Spent this month</span>
                <span className={view.overSpent ? "text-primary" : "text-ink"}>
                  {formatMoney(view.spentCents)}
                </span>
              </div>
              <ProgressBar
                percent={view.spendPercent}
                color={view.overSpent ? "var(--primary)" : "var(--pos)"}
                height={8}
                className="mt-2"
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-edge pt-4">
              <SummaryStat
                label="Left to allocate"
                value={formatMoney(Math.abs(view.leftToAllocateCents))}
                suffix={view.overAllocated ? "over" : "left"}
                tone={view.overAllocated ? "alert" : "positive"}
              />
              <SummaryStat
                label="Left to spend"
                value={formatMoney(Math.abs(view.leftToSpendCents))}
                suffix={view.overSpent ? "over" : "left"}
                tone={view.overSpent ? "alert" : "positive"}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {view.groups.map((group) => {
              const open = collapsed[group.id] !== true;
              const leftTone = group.remainingCents < 0 ? "text-primary" : "text-green";
              return (
                <section
                  key={group.id}
                  className="overflow-hidden rounded-[14px] border border-edge bg-card"
                >
                  <button
                    type="button"
                    onClick={() => setCollapsed((prev) => ({ ...prev, [group.id]: open }))}
                    className="flex w-full items-start justify-between gap-4 px-[18px] py-4 text-left"
                  >
                    <div className="flex items-start gap-3">
                      {open ? (
                        <ChevronDown size={16} strokeWidth={2.2} className="mt-0.5 text-muted" />
                      ) : (
                        <ChevronRight size={16} strokeWidth={2.2} className="mt-0.5 text-muted" />
                      )}
                      <div>
                        <div className="text-[15px] font-bold text-ink">{group.label}</div>
                        <div className="mt-1 text-[12px] font-medium text-muted">
                          {formatMoney(group.budgetCents)} budget · {formatMoney(group.spentCents)}{" "}
                          spent
                          {" · "}
                          <span className={`font-semibold ${leftTone}`}>
                            {formatMoney(Math.abs(group.remainingCents))}{" "}
                            {group.remainingCents < 0 ? "over" : "left"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-0.5 text-[12px] font-medium text-muted">
                      {group.rowCount} {group.rowCount === 1 ? "category" : "categories"}
                    </div>
                  </button>

                  {open && (
                    <div className="border-t border-edge">
                      {group.rows.map((row) => (
                        <BudgetRow
                          key={row.categoryId}
                          group={group}
                          row={row}
                          onClick={() => setSelectedCategoryId(row.categoryId)}
                          onEditCategory={() => {
                            const category = categories.find(
                              (entry) => entry.id === row.categoryId,
                            );
                            if (category) setEditing(category);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function BudgetRow({
  group,
  row,
  onClick,
  onEditCategory,
}: {
  group: BudgetGroup;
  row: BudgetGroup["rows"][number];
  onClick: () => void;
  onEditCategory: () => void;
}) {
  return (
    <div className="border-t border-edge first:border-t-0">
      <div className="flex items-start gap-4 px-[18px] py-[15px]">
        <button type="button" onClick={onClick} className="min-w-0 flex-1 text-left">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[14px] font-bold text-ink">
                <span className="text-[18px]">{row.emoji}</span>
                <span className="truncate">{row.name}</span>
              </div>
              <div className="mt-1 text-[12px] font-medium text-muted">{group.label} category</div>
            </div>
            <div className="pt-0.5 text-right text-[12px] font-medium text-muted">
              {formatMoney(row.budgetCents)} budget · {formatMoney(row.spentCents)} spent
              {" · "}
              <span className={`font-semibold ${row.isOver ? "text-primary" : "text-green"}`}>
                {formatMoney(Math.abs(row.remainingCents))} {row.isOver ? "over" : "left"}
              </span>
            </div>
          </div>
          <ProgressBar
            percent={row.progressPercent}
            color={row.isOver ? "var(--primary)" : row.color}
            height={7}
            className="mt-2.5"
          />
        </button>

        <button
          type="button"
          onClick={onEditCategory}
          className="text-[12px] font-semibold text-muted transition-colors hover:text-primary"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: string;
  suffix: string;
  tone: "positive" | "alert";
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
        {label}
      </div>
      <div
        className={`mt-1 text-[24px] font-bold tracking-[-0.02em] tabular-nums ${
          tone === "alert" ? "text-primary" : "text-green"
        }`}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[12px] font-medium text-muted">{suffix}</div>
    </div>
  );
}
