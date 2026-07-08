"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { EditRecurringForm } from "@/components/shared/EditRecurringForm";
import { RecurringRow } from "@/components/ui/RecurringRow";
import { Modal } from "@/components/ui/overlays";
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
  const { incomeCents, outCents, activeCount } = recurringTotals(recurring);
  const [editing, setEditing] = useState<RecurringItem | "new" | null>(null);

  const isEmpty = recurring.length === 0;

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

      <div className="mt-4">
        {/* Income / Out summary stats */}
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

        {isEmpty ? (
          /* Empty state — matches "Bills - recurring - empty" */
          <div className="mt-14 flex flex-col items-center justify-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-track">
              <RefreshCw size={30} strokeWidth={1.7} className="text-muted" />
            </span>
            <div className="mt-[18px] text-lg font-bold text-ink">No recurring items yet</div>
            <div className="mt-[7px] max-w-[380px] text-[13.5px] font-medium leading-relaxed text-muted">
              Add your bills, subscriptions, and income to see what&rsquo;s due each month.
            </div>
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="mt-5 rounded-[10px] bg-primary px-5 py-[11px] text-[13px] font-semibold text-onprimary"
            >
              + Add recurring item
            </button>
          </div>
        ) : (
          <>
            {/* All recurring header */}
            <div className="mt-[22px] flex items-center justify-between">
              <span className="text-[15px] font-bold text-ink">All recurring</span>
              <span className="text-[12.5px] font-medium text-muted">{activeCount} active</span>
            </div>

            {/* Recurring rows — RecurringRow keeps the pause toggle + edit wiring */}
            <div className="mt-2 border-t border-edge">
              {recurring.map((item) => (
                <RecurringRow
                  key={item.id}
                  item={item}
                  onToggle={() => toggleRecurring(item.id)}
                  onEdit={() => setEditing(item)}
                  divider
                />
              ))}
            </div>

            {/* Dashed add-recurring affordance */}
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="mt-1.5 w-full rounded-[14px] border border-dashed border-edge p-[13px] text-center text-[12.5px] font-semibold text-primary"
            >
              + Add recurring item
            </button>
          </>
        )}
      </div>
    </>
  );
}
