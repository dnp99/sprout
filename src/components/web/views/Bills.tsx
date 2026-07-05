"use client";

import { RecurringRow } from "@/components/ui/RecurringRow";
import { recurringTotals } from "@/lib/budget";
import { formatMoney } from "@/lib/format";
import { billsDueThisMonthCents, mockUpcomingBills } from "@/lib/mock";
import { useStore } from "@/state/store";

export function Bills() {
  const { recurring, toggleRecurring } = useStore();
  const { outCents, activeCount } = recurringTotals(recurring);

  return (
    <div className="flex gap-4">
      <div className="flex w-[300px] flex-none flex-col gap-4">
        <div className="rounded-[20px] bg-surface p-6 text-bg">
          <div className="text-xs font-extrabold uppercase text-subtle">Due this month</div>
          <div className="mt-1.5 text-[30px] font-extrabold tabular-nums">
            {formatMoney(billsDueThisMonthCents, { forceCents: true })}
          </div>
        </div>
        <div className="rounded-[20px] bg-card p-5">
          <div className="mb-3.5 text-sm font-extrabold text-ink">Coming up</div>
          <div className="flex flex-col gap-3 text-[13px]">
            {mockUpcomingBills.map((bill) => (
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
          <span className="text-xs font-bold text-muted">
            {activeCount} · {formatMoney(-outCents, { signed: true })}/mo
          </span>
        </div>
        {recurring.map((item) => (
          <RecurringRow
            key={item.id}
            item={item}
            onToggle={() => toggleRecurring(item.id)}
            divider
          />
        ))}
      </div>
    </div>
  );
}
