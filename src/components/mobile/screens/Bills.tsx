"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { deriveUpcomingBills, monthlyBillsTotalCents } from "@/lib/bills";
import { formatMoney } from "@/lib/format";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

// Small recurring expenses read as subscriptions (Netflix, Spotify, iCloud…).
const SUBSCRIPTION_MAX_CENTS = 3000;

export function Bills() {
  const { recurring, goMobile } = useStore(
    useShallow((s) => ({ recurring: s.recurring, goMobile: s.goMobile })),
  );
  const upcoming = deriveUpcomingBills(recurring, new Date(), 6);
  const dueThisMonthCents = monthlyBillsTotalCents(recurring);
  const subscriptions = recurring.filter(
    (r) => !r.isIncome && !r.paused && Math.abs(r.amountCents) <= SUBSCRIPTION_MAX_CENTS,
  );

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
          {formatMoney(dueThisMonthCents, { forceCents: true })}
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

      {recurring.length === 0 ? (
        <EmptyState
          className="mt-4"
          emoji="🧾"
          title="No recurring items yet"
          subtitle="Add your bills, subscriptions, and income to see what's due each month."
        />
      ) : (
        <>
          <h2 className="mt-[18px] text-[15px] font-extrabold text-ink">Coming up</h2>
          <div className="mt-3 flex flex-col gap-2.5">
            {upcoming.length === 0 && (
              <div className="rounded-[18px] bg-card px-4 py-3 text-[13px] font-semibold text-muted">
                No bills coming up.
              </div>
            )}
            {upcoming.map((bill) => (
              <div
                key={bill.id}
                className="flex items-center gap-3 rounded-[18px] bg-card px-4 py-3"
              >
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
            {subscriptions.length === 0 && (
              <div className="rounded-[18px] bg-card px-4 py-3 text-[13px] font-semibold text-muted">
                No subscriptions.
              </div>
            )}
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center gap-3 rounded-[18px] bg-card px-4 py-3"
              >
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
        </>
      )}
    </div>
  );
}
