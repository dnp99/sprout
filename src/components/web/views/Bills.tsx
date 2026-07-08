"use client";

import { useState } from "react";
import { EditRecurringForm } from "@/components/shared/EditRecurringForm";
import { RecurringRow } from "@/components/ui/RecurringRow";
import { Modal } from "@/components/ui/overlays";
import { deriveUpcomingBills, monthlyBillsTotalCents } from "@/lib/bills";
import { recurringTotals } from "@/lib/budget";
import { formatMoney } from "@/lib/format";
import type { RecurringItem } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

export function Bills() {
  const { recurring, toggleRecurring } = useStore(
    useShallow((s) => ({
      recurring: s.recurring,
      toggleRecurring: s.toggleRecurring,
    })),
  );
  const { outCents, activeCount } = recurringTotals(recurring);
  const upcoming = deriveUpcomingBills(recurring);
  const dueThisMonthCents = monthlyBillsTotalCents(recurring);
  const [editing, setEditing] = useState<RecurringItem | "new" | null>(null);

  return (
    <>
      {editing && (
        <Modal
          title={editing === "new" ? "New recurring 🔄" : "Edit recurring ✍️"}
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

      <div className="flex gap-4">
        <div className="flex w-[300px] flex-none flex-col gap-4">
          <div className="rounded-[20px] bg-surface p-6 text-bg">
            <div className="text-xs font-extrabold uppercase text-subtle">Due this month</div>
            <div className="mt-1.5 text-[30px] font-extrabold tabular-nums">
              {formatMoney(dueThisMonthCents, { forceCents: true })}
            </div>
          </div>
          <div className="rounded-[20px] bg-card p-5">
            <div className="mb-3.5 text-sm font-extrabold text-ink">Coming up</div>
            <div className="flex flex-col gap-3 text-[13px]">
              {upcoming.length === 0 && (
                <div className="font-semibold text-muted">No bills coming up.</div>
              )}
              {upcoming.map((bill) => (
                <div key={bill.id} className="flex justify-between">
                  <span className="font-bold">
                    {bill.emoji} {bill.name}
                  </span>
                  <span className={`font-bold ${bill.urgent ? "text-primary-dark" : "text-muted"}`}>
                    {bill.dueLabel.replace(" days", "d")} ·{" "}
                    {formatMoney(bill.amountCents, { forceCents: true })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 rounded-[20px] bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[15px] font-extrabold text-ink">Recurring items</span>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-muted">
                {activeCount} · {formatMoney(-outCents, { signed: true })}/mo
              </span>
              <button
                type="button"
                onClick={() => setEditing("new")}
                className="rounded-xl bg-primary px-3.5 py-1.5 text-[12.5px] font-extrabold text-white"
              >
                + Add
              </button>
            </div>
          </div>
          {recurring.length === 0 ? (
            <div className="py-6 text-center text-[13px] font-semibold text-muted">
              No recurring items yet — add your bills, subscriptions, and income.
            </div>
          ) : (
            recurring.map((item) => (
              <RecurringRow
                key={item.id}
                item={item}
                onToggle={() => toggleRecurring(item.id)}
                onEdit={() => setEditing(item)}
                divider
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
