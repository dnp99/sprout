"use client";

import { formatMoney } from "@/lib/format";
import { billsDueThisMonthCents, mockUpcomingBills } from "@/lib/mock";
import { useStore } from "@/state/store";

export function Bills() {
  const { recurring, goMobile } = useStore();
  const subscriptions = recurring.filter((r) => r.id === "spotify" || r.id === "icloud");

  return (
    <div className="px-[22px] pt-3">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-extrabold text-ink">Bills 🧾</h1>
        <button
          type="button"
          onClick={() => goMobile("addBill")}
          className="rounded-2xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white"
        >
          + Add
        </button>
      </div>

      <div className="mt-4 rounded-card bg-surface p-5 text-bg">
        <div className="text-xs font-extrabold uppercase tracking-wide text-subtle">
          Due this month
        </div>
        <div className="mt-1 text-[30px] font-extrabold tabular-nums">
          {formatMoney(billsDueThisMonthCents, { forceCents: true })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => goMobile("recurring")}
        className="mt-3 flex w-full items-center gap-3 rounded-[18px] bg-card px-4 py-3.5 text-left"
      >
        <span className="text-xl">🔄</span>
        <div className="flex-1">
          <div className="text-sm font-extrabold text-ink">Manage recurring</div>
          <div className="text-[11px] font-bold text-muted">Bills, subscriptions &amp; income</div>
        </div>
        <span className="font-extrabold text-primary">›</span>
      </button>

      <h2 className="mt-[18px] text-[15px] font-extrabold text-ink">Coming up</h2>
      <div className="mt-3 flex flex-col gap-2.5">
        {mockUpcomingBills.map((bill) => (
          <div key={bill.id} className="flex items-center gap-3 rounded-[18px] bg-card px-4 py-3">
            <span className="text-[22px]">{bill.emoji}</span>
            <div className="flex-1">
              <div className="text-sm font-extrabold text-ink">{bill.name}</div>
              <div
                className={`text-[11px] font-bold ${bill.urgent ? "text-primary-dark" : "text-muted"}`}
              >
                {bill.dueLabel}
              </div>
            </div>
            <span className="text-sm font-extrabold tabular-nums text-ink">
              {formatMoney(bill.amountCents, { forceCents: true })}
            </span>
          </div>
        ))}
      </div>

      <h2 className="mt-[18px] text-[15px] font-extrabold text-ink">Subscriptions</h2>
      <div className="mt-3 flex flex-col gap-2.5">
        {subscriptions.map((sub) => (
          <div key={sub.id} className="flex items-center gap-3 rounded-[18px] bg-card px-4 py-3">
            <span className="text-[22px]">{sub.emoji}</span>
            <div className="flex-1">
              <div className="text-sm font-extrabold text-ink">{sub.name}</div>
              <div className="text-[11px] font-bold text-muted">Monthly</div>
            </div>
            <span className="text-sm font-extrabold tabular-nums text-ink">
              {formatMoney(Math.abs(sub.amountCents), { forceCents: true })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
