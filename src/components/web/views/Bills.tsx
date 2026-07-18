"use client";

import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { EditRecurringForm } from "@/components/shared/EditRecurringForm";
import { RecurringCalendarView } from "@/components/shared/RecurringCalendarView";
import { MonthlyRecurringView } from "@/components/shared/MonthlyRecurringView";
import {
  RecurringViewModeToggle,
  type RecurringViewMode,
} from "@/components/shared/RecurringViewModeToggle";
import { RecurringRow } from "@/components/ui/RecurringRow";
import { Modal } from "@/components/ui/overlays";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import { recurringTotals } from "@/lib/budget";
import { reconcileRecurring } from "@/lib/recurring/reconcile";
import { currentMonthKey } from "@/lib/trends";
import type { RecurringItem } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

type BillsTab = "monthly" | "all";

/** Desktop recurring surface. Monthly answers what happened in the selected
 *  calendar month; All recurring keeps the schedule-management workflow. */
export function Bills() {
  const {
    recurring,
    transactions,
    transactionsLoading,
    categories,
    viewMonthKey,
    toggleRecurring,
    markRecurringPaid,
  } = useStore(
    useShallow((s) => ({
      recurring: s.recurring,
      transactions: s.transactions,
      transactionsLoading: s.transactionsLoading,
      categories: s.categories,
      viewMonthKey: s.viewMonthKey,
      toggleRecurring: s.toggleRecurring,
      markRecurringPaid: s.markRecurringPaid,
    })),
  );
  const t = useTranslations("bills");
  const [tab, setTab] = useState<BillsTab>("monthly");
  const [viewMode, setViewMode] = useState<RecurringViewMode>("list");
  const [editing, setEditing] = useState<RecurringItem | "new" | null>(null);
  const [markingOccurrenceId, setMarkingOccurrenceId] = useState<string | null>(null);
  const monthKey = viewMonthKey || currentMonthKey();
  const summary = useMemo(
    () => reconcileRecurring(recurring, transactions, { monthKey }),
    [recurring, transactions, monthKey],
  );
  const { incomeCents, outCents, activeCount } = recurringTotals(recurring);
  const isEmpty = recurring.length === 0;
  const markPaid = async (recurringId: string, dueDate: string, occurrenceId: string) => {
    setMarkingOccurrenceId(occurrenceId);
    try {
      await markRecurringPaid(recurringId, dueDate);
    } finally {
      setMarkingOccurrenceId(null);
    }
  };

  return (
    <>
      {editing && (
        <Modal
          title={editing === "new" ? t("newRecurring") : t("editRecurring")}
          onClose={() => setEditing(null)}
        >
          <div className="mt-4">
            <EditRecurringForm
              item={editing === "new" ? undefined : editing}
              onDone={() => setEditing(null)}
            />
          </div>
        </Modal>
      )}

      <div className="mt-4">
        {isEmpty ? (
          <EmptyRecurringState onAdd={() => setEditing("new")} />
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <TabToggle tab={tab} onChange={setTab} />
              {tab === "monthly" ? (
                <RecurringViewModeToggle value={viewMode} onChange={setViewMode} />
              ) : (
                <span className="text-[12.5px] font-medium text-muted">
                  {t("activeCount", { count: activeCount })}
                </span>
              )}
            </div>

            {tab === "monthly" ? (
              <div className="mt-5">
                {viewMode === "list" ? (
                  <MonthlyRecurringView
                    summary={summary}
                    categories={categories}
                    loading={transactionsLoading}
                    focusNeedsReview={
                      monthKey === currentMonthKey() && summary.unmatched.length > 0
                    }
                    onEdit={(id) => {
                      const item = recurring.find((entry) => entry.id === id);
                      if (item) setEditing(item);
                    }}
                    onMarkPaid={(row) =>
                      void markPaid(row.recurringId, row.dueDate, row.occurrenceId)
                    }
                    markingOccurrenceId={markingOccurrenceId}
                  />
                ) : (
                  <RecurringCalendarView
                    summary={summary}
                    loading={transactionsLoading}
                    onEdit={(id) => {
                      const item = recurring.find((entry) => entry.id === id);
                      if (item) setEditing(item);
                    }}
                    onMarkPaid={(row) =>
                      void markPaid(row.recurringId, row.dueDate, row.occurrenceId)
                    }
                    markingOccurrenceId={markingOccurrenceId}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setEditing("new")}
                  className="mt-4 w-full rounded-[14px] border border-dashed border-edge p-[13px] text-center text-[12.5px] font-semibold text-primary"
                >
                  {t("addItem")}
                </button>
              </div>
            ) : (
              <AllRecurring
                recurring={recurring}
                incomeCents={incomeCents}
                outCents={outCents}
                onToggle={toggleRecurring}
                onEdit={setEditing}
                onAdd={() => setEditing("new")}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}

function TabToggle({ tab, onChange }: { tab: BillsTab; onChange: (tab: BillsTab) => void }) {
  const t = useTranslations("bills");
  return (
    <div className="flex rounded-[10px] bg-track p-1">
      {(
        [
          ["monthly", t("tabMonthly")],
          ["all", t("tabAll")],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`rounded-[7px] px-3 py-1.5 text-[12px] font-semibold transition ${
            tab === value ? "bg-primary text-onprimary shadow-sm" : "text-muted"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function AllRecurring({
  recurring,
  incomeCents,
  outCents,
  onToggle,
  onEdit,
  onAdd,
}: {
  recurring: RecurringItem[];
  incomeCents: number;
  outCents: number;
  onToggle: (id: string) => void;
  onEdit: (item: RecurringItem) => void;
  onAdd: () => void;
}) {
  const t = useTranslations("bills");
  const fmt = useFormatters();
  return (
    <div className="mt-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-[14px] bg-green/10 p-[16px_18px]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {t("incomePerMonth")}
          </div>
          <div className="mt-1 text-2xl font-bold tracking-tight tabular-nums text-green">
            {fmt.money(incomeCents, { signed: true })}
          </div>
        </div>
        <div className="rounded-[14px] border border-edge bg-card p-[16px_18px]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {t("outPerMonth")}
          </div>
          <div className="mt-1 text-2xl font-bold tracking-tight tabular-nums text-ink">
            {fmt.money(outCents)}
          </div>
        </div>
      </div>

      <div className="mt-[22px] border-t border-edge">
        {recurring.map((item) => (
          <RecurringRow
            key={item.id}
            item={item}
            onToggle={() => onToggle(item.id)}
            onEdit={() => onEdit(item)}
            divider
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-1.5 w-full rounded-[14px] border border-dashed border-edge p-[13px] text-center text-[12.5px] font-semibold text-primary"
      >
        {t("addItem")}
      </button>
    </div>
  );
}

function EmptyRecurringState({ onAdd }: { onAdd: () => void }) {
  const t = useTranslations("bills");
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-track">
        <RefreshCw size={30} strokeWidth={1.7} className="text-muted" />
      </span>
      <div className="mt-[18px] text-lg font-bold text-ink">{t("emptyTitle")}</div>
      <div className="mt-[7px] max-w-[380px] text-[13.5px] font-medium leading-relaxed text-muted">
        {t("emptyBodyWeb")}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-5 rounded-[10px] bg-primary px-5 py-[11px] text-[13px] font-semibold text-onprimary"
      >
        {t("addItem")}
      </button>
    </div>
  );
}
