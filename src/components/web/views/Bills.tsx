"use client";

import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { EditRecurringForm } from "@/components/shared/EditRecurringForm";
import { MonthlyRecurringView } from "@/components/shared/MonthlyRecurringView";
import { RecurringRow } from "@/components/ui/RecurringRow";
import { Modal } from "@/components/ui/overlays";
import { recurringTotals } from "@/lib/budget";
import { formatMoney } from "@/lib/format";
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
  } = useStore(
    useShallow((s) => ({
      recurring: s.recurring,
      transactions: s.transactions,
      transactionsLoading: s.transactionsLoading,
      categories: s.categories,
      viewMonthKey: s.viewMonthKey,
      toggleRecurring: s.toggleRecurring,
    })),
  );
  const [tab, setTab] = useState<BillsTab>("monthly");
  const [editing, setEditing] = useState<RecurringItem | "new" | null>(null);
  const monthKey = viewMonthKey || currentMonthKey();
  const summary = useMemo(
    () => reconcileRecurring(recurring, transactions, { monthKey }),
    [recurring, transactions, monthKey],
  );
  const { incomeCents, outCents, activeCount } = recurringTotals(recurring);
  const isEmpty = recurring.length === 0;

  return (
    <>
      {editing && (
        <Modal
          title={editing === "new" ? "New recurring" : "Edit recurring"}
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
              {tab === "all" && (
                <span className="text-[12.5px] font-medium text-muted">{activeCount} active</span>
              )}
            </div>

            {tab === "monthly" ? (
              <div className="mt-5">
                <MonthlyRecurringView
                  summary={summary}
                  categories={categories}
                  loading={transactionsLoading}
                  onEdit={(id) => {
                    const item = recurring.find((entry) => entry.id === id);
                    if (item) setEditing(item);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setEditing("new")}
                  className="mt-4 w-full rounded-[14px] border border-dashed border-edge p-[13px] text-center text-[12.5px] font-semibold text-primary"
                >
                  + Add recurring item
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
          className={`rounded-[7px] px-3 py-1.5 text-[12px] font-semibold transition ${
            tab === value ? "bg-card text-ink shadow-sm" : "text-muted"
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
  return (
    <div className="mt-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-[14px] bg-green/10 p-[16px_18px]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Income / mo
          </div>
          <div className="mt-1 text-2xl font-bold tracking-tight tabular-nums text-green">
            {formatMoney(incomeCents, { signed: true })}
          </div>
        </div>
        <div className="rounded-[14px] border border-edge p-[16px_18px]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Out / mo
          </div>
          <div className="mt-1 text-2xl font-bold tracking-tight tabular-nums text-ink">
            {formatMoney(outCents)}
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
        + Add recurring item
      </button>
    </div>
  );
}

function EmptyRecurringState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-track">
        <RefreshCw size={30} strokeWidth={1.7} className="text-muted" />
      </span>
      <div className="mt-[18px] text-lg font-bold text-ink">No recurring items yet</div>
      <div className="mt-[7px] max-w-[380px] text-[13.5px] font-medium leading-relaxed text-muted">
        Add your bills, subscriptions, and income to see what&apos;s due each month.
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-5 rounded-[10px] bg-primary px-5 py-[11px] text-[13px] font-semibold text-onprimary"
      >
        + Add recurring item
      </button>
    </div>
  );
}
