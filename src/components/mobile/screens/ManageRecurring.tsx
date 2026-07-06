"use client";

import { useState } from "react";
import { EditRecurringForm } from "@/components/shared/EditRecurringForm";
import { RecurringRow } from "@/components/ui/RecurringRow";
import { ScreenHeader } from "@/components/ui/headers";
import { recurringTotals } from "@/lib/budget";
import { formatMoney } from "@/lib/format";
import type { RecurringItem } from "@/lib/types";
import { useStore } from "@/state/store";

export function ManageRecurring() {
  const { recurring, goMobile, toggleRecurring } = useStore();
  const { incomeCents, outCents, activeCount } = recurringTotals(recurring);
  const [editing, setEditing] = useState<RecurringItem | "new" | null>(null);

  if (editing) {
    return (
      <div className="px-[22px] pt-3">
        <ScreenHeader
          title={editing === "new" ? "New recurring" : "Edit recurring"}
          onBack={() => setEditing(null)}
        />
        <div className="mt-5">
          <EditRecurringForm
            item={editing === "new" ? undefined : editing}
            onDone={() => setEditing(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="px-[22px] pt-3">
      <ScreenHeader title="Recurring 🔄" onBack={() => goMobile("bills")} />

      <div className="mt-4 flex gap-2.5">
        <div className="flex-1 rounded-[18px] bg-[#e4ebd6] px-4 py-3.5">
          <div className="text-[10.5px] font-extrabold uppercase text-[#5f7a42]">Income / mo</div>
          <div className="mt-0.5 whitespace-nowrap text-[18px] font-extrabold tabular-nums text-[#4f7a3a]">
            {formatMoney(incomeCents, { signed: true })}
          </div>
        </div>
        <div className="flex-1 rounded-[18px] bg-card px-4 py-3.5">
          <div className="text-[10.5px] font-extrabold uppercase text-muted">Out / mo</div>
          <div className="mt-0.5 whitespace-nowrap text-[18px] font-extrabold tabular-nums text-ink">
            {formatMoney(-outCents, { signed: true })}
          </div>
        </div>
      </div>

      <div className="mt-[18px] flex items-center justify-between">
        <span className="text-[15px] font-extrabold text-ink">All recurring</span>
        <span className="text-xs font-bold text-muted">{activeCount} active</span>
      </div>
      <div className="mt-3 flex flex-col gap-2.5">
        {recurring.map((item) => (
          <RecurringRow
            key={item.id}
            item={item}
            onToggle={() => toggleRecurring(item.id)}
            onEdit={() => setEditing(item)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setEditing("new")}
        className="mt-4 w-full rounded-2xl border-2 border-dashed border-edge py-3.5 text-center text-[13.5px] font-extrabold text-primary-dark"
      >
        + Add recurring item
      </button>
    </div>
  );
}
