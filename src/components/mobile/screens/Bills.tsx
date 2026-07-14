"use client";

import { Receipt } from "lucide-react";
import { useMemo, useState } from "react";
import { RecurringCalendarView } from "@/components/shared/RecurringCalendarView";
import { MonthlyRecurringView } from "@/components/shared/MonthlyRecurringView";
import { MonthStepper } from "@/components/shared/MonthStepper";
import {
  RecurringViewModeToggle,
  type RecurringViewMode,
} from "@/components/shared/RecurringViewModeToggle";
import { RecurringRow } from "@/components/ui/RecurringRow";
import { reconcileRecurring } from "@/lib/recurring/reconcile";
import { currentMonthKey } from "@/lib/trends";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

type BillsTab = "monthly" | "all";

/** Mobile Bills uses the same occurrence-based view model as desktop. The
 *  All recurring tab remains an intentionally simple route into schedule admin. */
export function Bills() {
  const {
    recurring,
    transactions,
    transactionsLoading,
    categories,
    viewMonthKey,
    goMobile,
    toggleRecurring,
    markRecurringPaid,
  } = useStore(
    useShallow((s) => ({
      recurring: s.recurring,
      transactions: s.transactions,
      transactionsLoading: s.transactionsLoading,
      categories: s.categories,
      viewMonthKey: s.viewMonthKey,
      goMobile: s.goMobile,
      toggleRecurring: s.toggleRecurring,
      markRecurringPaid: s.markRecurringPaid,
    })),
  );
  const [tab, setTab] = useState<BillsTab>("monthly");
  const [viewMode, setViewMode] = useState<RecurringViewMode>("list");
  const [markingOccurrenceId, setMarkingOccurrenceId] = useState<string | null>(null);
  const monthKey = viewMonthKey || currentMonthKey();
  const summary = useMemo(
    () => reconcileRecurring(recurring, transactions, { monthKey }),
    [recurring, transactions, monthKey],
  );
  const markPaid = async (recurringId: string, dueDate: string, occurrenceId: string) => {
    setMarkingOccurrenceId(occurrenceId);
    try {
      await markRecurringPaid(recurringId, dueDate);
    } finally {
      setMarkingOccurrenceId(null);
    }
  };

  if (recurring.length === 0) {
    return <EmptyBills onAdd={() => goMobile("addBill")} />;
  }

  return (
    <div className="px-4 pb-8 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabToggle tab={tab} onChange={setTab} />
        {tab === "monthly" && <MonthStepper compact showToday defaultToCurrent />}
      </div>

      {tab === "monthly" ? (
        <div className="mt-4">
          <div className="mb-3 flex justify-end">
            <RecurringViewModeToggle value={viewMode} onChange={setViewMode} compact />
          </div>
          {viewMode === "list" ? (
            <MonthlyRecurringView
              summary={summary}
              categories={categories}
              loading={transactionsLoading}
              compact
              focusNeedsReview={monthKey === currentMonthKey() && summary.unmatched.length > 0}
              onEdit={() => goMobile("recurring")}
              onMarkPaid={(row) => void markPaid(row.recurringId, row.dueDate, row.occurrenceId)}
              markingOccurrenceId={markingOccurrenceId}
            />
          ) : (
            <RecurringCalendarView
              summary={summary}
              loading={transactionsLoading}
              compact
              onEdit={() => goMobile("recurring")}
              onMarkPaid={(row) => void markPaid(row.recurringId, row.dueDate, row.occurrenceId)}
              markingOccurrenceId={markingOccurrenceId}
            />
          )}
          <button
            type="button"
            onClick={() => goMobile("addBill")}
            className="mt-3 w-full rounded-[10px] border border-dashed border-edge py-3 text-center text-[12.5px] font-semibold text-primary"
          >
            + Add recurring item
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => goMobile("recurring")}
            className="flex w-full items-center justify-between rounded-[10px] border border-edge px-3 py-3 text-left"
          >
            <div>
              <div className="text-[12.5px] font-semibold text-ink">Manage recurring</div>
              <div className="mt-0.5 text-[10.5px] font-medium text-muted">
                Edit, pause, or remove schedules
              </div>
            </div>
            <span className="text-[11px] font-semibold text-primary">Open</span>
          </button>
          <div className="mt-3 overflow-hidden rounded-[10px] border border-edge">
            {recurring.map((item) => (
              <div key={item.id} className="px-3">
                <RecurringRow
                  item={item}
                  divider
                  onToggle={() => toggleRecurring(item.id)}
                  onEdit={() => goMobile("recurring")}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => goMobile("addBill")}
            className="mt-3 w-full rounded-[10px] border border-dashed border-edge py-3 text-center text-[12.5px] font-semibold text-primary"
          >
            + Add recurring item
          </button>
        </div>
      )}
    </div>
  );
}

function TabToggle({ tab, onChange }: { tab: BillsTab; onChange: (tab: BillsTab) => void }) {
  return (
    <div className="flex rounded-[10px] bg-track p-1">
      {(
        [
          ["monthly", "Monthly"],
          ["all", "All recurring"],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`rounded-[7px] px-2.5 py-1.5 text-[11px] font-semibold transition ${
            tab === value ? "bg-card text-ink shadow-sm" : "text-muted"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function EmptyBills({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex min-h-[calc(100svh-180px)] flex-col items-center justify-center px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-track">
        <Receipt size={26} strokeWidth={1.8} className="text-muted" />
      </span>
      <div className="mt-4 text-[15px] font-semibold text-ink">No recurring items yet</div>
      <div className="mt-1.5 text-[12px] font-medium leading-relaxed text-muted">
        Add a bill, subscription, or income item to track what&apos;s due each month.
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 rounded-[10px] bg-primary px-4 py-2 text-[12px] font-semibold text-onprimary"
      >
        Add recurring item
      </button>
    </div>
  );
}
