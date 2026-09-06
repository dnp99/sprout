"use client";

import { ChevronDown, ChevronRight, NotebookText, Pencil, Tag } from "lucide-react";
import { useMemo, useState } from "react";
import { IncomeSourcesBudgetPanel } from "@/components/shared/IncomeSourcesBudgetPanel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { buildBudgetTrackingView, type BudgetGroup } from "@/lib/budget-view";
import { formatMoney } from "@/lib/format";
import { resolveViewMonth } from "@/lib/trends";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { useFormatters } from "@/i18n/useFormatters";
import { useTranslations } from "next-intl";

/** Mobile Budget tab — month-aware budget tracking with grouped category rows.
 *  Editing stays in the shared budget sheet so the main screen can focus on
 *  planned/spent/left status for the selected month. */
export function Categories() {
  const t = useTranslations("budget");
  const fmt = useFormatters();
  const {
    user,
    categories,
    recurring,
    transactions,
    viewMonthKey,
    webBudgets,
    openCategory,
    goMobile,
  } = useStore(
    useShallow((s) => ({
      user: s.user,
      categories: s.categories,
      recurring: s.recurring,
      transactions: s.transactions,
      viewMonthKey: s.viewMonthKey,
      webBudgets: s.webBudgets,
      openCategory: s.openCategory,
      goMobile: s.goMobile,
    })),
  );
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<"expenses" | "income">("expenses");

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

  return (
    <div className="px-4 pb-8 pt-1.5">
      <div
        className="mb-3 grid grid-cols-2 rounded-[10px] border border-edge bg-card p-1"
        role="tablist"
        aria-label="Budget type"
      >
        {(["expenses", "income"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`h-10 rounded-[7px] text-[12px] font-semibold ${tab === value ? "bg-primary text-onprimary" : "text-muted"}`}
          >
            {value === "expenses" ? t("expenses") : t("income")}
          </button>
        ))}
      </div>
      {tab === "income" ? (
        <IncomeSourcesBudgetPanel monthKey={monthKey} compact />
      ) : (
        <>
          <div className="rounded-[14px] border border-edge bg-card p-4">
            {/* Editing lives as a pencil next to the headline rather than a sticky
            bottom bar, so the screen stays a plain scroll. */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10.5px] font-bold uppercase tracking-[.05em] text-muted">
                  Monthly budget
                </div>
                <div className="mt-1 text-[28px] font-bold leading-none tabular-nums text-ink">
                  {formatMoney(view.budgetCents)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => goMobile("budget")}
                aria-label="Edit budget"
                className="-mr-1.5 -mt-1.5 flex h-11 w-11 flex-none items-center justify-center rounded-[12px] text-muted transition active:bg-track"
              >
                <Pencil size={17} strokeWidth={2} />
              </button>
            </div>
            <div className="mt-1.5 text-[12px] font-medium text-muted">
              Tracking {fmt.monthKey(monthKey)}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-[12px] font-medium text-muted">
                <span>Allocated</span>
                <span className={view.overAllocated ? "text-primary" : "text-green"}>
                  {formatMoney(view.allocatedCents)}
                </span>
              </div>
              <ProgressBar
                percent={view.allocationPercent}
                color={view.overAllocated ? "var(--primary)" : "var(--pos)"}
                height={7}
                className="mt-2"
              />
            </div>

            <div className="mt-3.5">
              <div className="flex items-center justify-between text-[12px] font-medium text-muted">
                <span>Spent this month</span>
                <span className={view.overSpent ? "text-primary" : "text-ink"}>
                  {formatMoney(view.spentCents)}
                </span>
              </div>
              <ProgressBar
                percent={view.spendPercent}
                color={view.overSpent ? "var(--primary)" : "var(--pos)"}
                height={7}
                className="mt-2"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-edge pt-4">
              <SummaryPill
                label="Unallocated"
                value={formatMoney(Math.abs(view.leftToAllocateCents))}
                suffix={view.overAllocated ? "over" : "left"}
                tone={view.overAllocated ? "alert" : "positive"}
              />
              <SummaryPill
                label="Available to spend"
                value={formatMoney(Math.abs(view.leftToSpendCents))}
                suffix={view.overSpent ? "over" : "left"}
                tone={view.overSpent ? "alert" : "positive"}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => goMobile("bills")}
            className="mt-3 flex w-full items-center gap-3 rounded-[14px] border border-edge bg-card px-3.5 py-3 text-left"
          >
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[12px] bg-track text-primary">
              <NotebookText size={18} strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-ink">Bills & recurring</div>
              <div className="mt-0.5 text-[11px] font-medium text-muted">
                {recurring.length === 0
                  ? "Open bills to add schedules"
                  : `${recurring.length} recurring ${recurring.length === 1 ? "item" : "items"}`}
              </div>
            </div>
            <ChevronRight size={16} strokeWidth={2} className="flex-none text-muted" />
          </button>

          <div className="mt-4 flex flex-col gap-2.5">
            {view.groups.map((group) => {
              const open = collapsed[group.id] !== true;
              return (
                <section
                  key={group.id}
                  className="overflow-hidden rounded-[12px] border border-edge"
                >
                  <button
                    type="button"
                    onClick={() => setCollapsed((prev) => ({ ...prev, [group.id]: open }))}
                    className="flex w-full items-start justify-between gap-3 px-3.5 py-3.5 text-left"
                  >
                    <div className="flex items-start gap-2.5">
                      {open ? (
                        <ChevronDown size={15} strokeWidth={2.2} className="mt-0.5 text-muted" />
                      ) : (
                        <ChevronRight size={15} strokeWidth={2.2} className="mt-0.5 text-muted" />
                      )}
                      <div>
                        <div className="text-[13.5px] font-semibold text-ink">{group.label}</div>
                        <div className="mt-1 text-[11px] font-medium text-muted">
                          {formatMoney(group.budgetCents)} budget · {formatMoney(group.spentCents)}{" "}
                          spent
                        </div>
                      </div>
                    </div>
                    <div
                      className={`pt-0.5 text-[12px] font-semibold ${
                        group.remainingCents < 0 ? "text-primary" : "text-green"
                      }`}
                    >
                      {formatMoney(Math.abs(group.remainingCents))}{" "}
                      {group.remainingCents < 0 ? "over" : "left"}
                    </div>
                  </button>

                  {open && (
                    <div className="border-t border-edge">
                      {group.rows.map((row) => (
                        <button
                          key={row.categoryId}
                          type="button"
                          onClick={() => openCategory(row.categoryId)}
                          className="flex w-full flex-col gap-2 border-t border-edge px-3.5 py-3 text-left first:border-t-0"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                                <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-track text-primary">
                                  <Tag size={13} />
                                </span>
                                <span className="truncate">{row.name}</span>
                              </div>
                              <div className="mt-1 text-[11px] font-medium text-muted">
                                {formatMoney(row.budgetCents)} budget ·{" "}
                                {formatMoney(row.spentCents)} spent
                              </div>
                            </div>
                            <div
                              className={`pt-0.5 text-[12px] font-semibold ${
                                row.isOver ? "text-primary" : "text-green"
                              }`}
                            >
                              {formatMoney(Math.abs(row.remainingCents))}{" "}
                              {row.isOver ? "over" : "left"}
                            </div>
                          </div>
                          <ProgressBar
                            percent={row.progressPercent}
                            color={
                              row.progressPercent >= 100
                                ? "var(--danger)"
                                : row.progressPercent >= 75
                                  ? "var(--warning)"
                                  : "var(--pos)"
                            }
                            height={6}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryPill({
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
    <div className="rounded-[12px] bg-card/55 px-3 py-2.5">
      <div className="text-[10.5px] font-semibold uppercase tracking-[.05em] text-muted">
        {label}
      </div>
      <div
        className={`mt-1 text-[20px] font-bold tracking-[-0.02em] tabular-nums ${
          tone === "alert" ? "text-primary" : "text-green"
        }`}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[11px] font-medium text-muted">{suffix}</div>
    </div>
  );
}
