"use client";

import { ChevronRight, Plus, Receipt, RefreshCw } from "lucide-react";
import { Fragment } from "react";
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
    <div className="flex min-h-full flex-col px-4 pt-1">
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-bold tracking-[-.02em] text-ink">Bills</h1>
        <button
          type="button"
          onClick={() => goMobile("addBill")}
          className="flex items-center gap-1.5 rounded-pill bg-primary px-3 py-1.5 text-onprimary"
        >
          <Plus size={13} strokeWidth={2.6} />
          <span className="text-[11.5px] font-semibold">Add</span>
        </button>
      </div>

      <div className="mt-3 rounded-[10px] border border-edge p-3.5">
        <div className="text-[11.5px] font-medium text-muted">Due this month</div>
        <div className="mt-px text-[26px] font-bold tracking-[-.02em] tabular-nums text-ink">
          {formatMoney(dueThisMonthCents, { forceCents: true })}
        </div>
        <div className="mt-0.5 text-[11px] font-medium text-muted">
          {recurring.length === 0 ? "Nothing due yet" : "Recurring bills & subscriptions"}
        </div>
      </div>

      <button
        type="button"
        onClick={() => goMobile("recurring")}
        className="mt-3 flex w-full items-center gap-3 rounded-[10px] border border-edge p-3 text-left"
      >
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[9px] bg-track">
          <RefreshCw size={16} strokeWidth={2} className="text-muted" />
        </span>
        <div className="flex-1">
          <div className="text-[12.5px] font-semibold text-ink">Manage recurring</div>
          <div className="text-[10.5px] font-medium text-muted">
            Bills, subscriptions &amp; income
          </div>
        </div>
        <ChevronRight size={14} strokeWidth={2} className="text-muted" />
      </button>

      {recurring.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-track">
            <Receipt size={26} strokeWidth={1.8} className="text-muted" />
          </span>
          <div className="mt-4 text-[15px] font-semibold text-ink">No bills yet</div>
          <div className="mt-1.5 text-[12px] font-medium leading-relaxed text-muted">
            Add a bill and we&rsquo;ll remind you a few days before it&rsquo;s due.
          </div>
          <button
            type="button"
            onClick={() => goMobile("addBill")}
            className="mt-4 rounded-[10px] bg-primary px-4 py-2 text-[12px] font-semibold text-onprimary"
          >
            Add a bill
          </button>
        </div>
      ) : (
        <>
          <div className="mb-2 mt-4 text-[10.5px] font-semibold uppercase tracking-[.04em] text-muted">
            Upcoming
          </div>
          {upcoming.length === 0 ? (
            <div className="rounded-[10px] border border-edge p-3 text-[12.5px] font-medium text-muted">
              No bills coming up.
            </div>
          ) : (
            <div className="overflow-hidden rounded-[10px] border border-edge">
              {upcoming.map((bill, i) => (
                <Fragment key={bill.id}>
                  {i > 0 && <div className="h-px bg-edge" />}
                  <div className="flex items-center gap-3 p-3">
                    <span className="text-[18px]">{bill.emoji}</span>
                    <div className="flex-1">
                      <div className="text-[12.5px] font-semibold text-ink">{bill.name}</div>
                      <div
                        className={`text-[10.5px] font-medium ${bill.urgent ? "text-primary-dark" : "text-muted"}`}
                      >
                        {bill.dueLabel}
                      </div>
                    </div>
                    <div className="text-[12.5px] font-semibold tabular-nums text-ink">
                      {formatMoney(bill.amountCents, { forceCents: true })}
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>
          )}

          <div className="mb-2 mt-4 text-[10.5px] font-semibold uppercase tracking-[.04em] text-muted">
            Subscriptions
          </div>
          {subscriptions.length === 0 ? (
            <div className="rounded-[10px] border border-edge p-3 text-[12.5px] font-medium text-muted">
              No subscriptions.
            </div>
          ) : (
            <div className="overflow-hidden rounded-[10px] border border-edge">
              {subscriptions.map((sub, i) => (
                <Fragment key={sub.id}>
                  {i > 0 && <div className="h-px bg-edge" />}
                  <div className="flex items-center gap-3 p-3">
                    <span className="text-[18px]">{sub.emoji}</span>
                    <div className="flex-1">
                      <div className="text-[12.5px] font-semibold text-ink">{sub.name}</div>
                      <div className="text-[10.5px] font-medium text-muted">Monthly</div>
                    </div>
                    <div className="text-[12.5px] font-semibold tabular-nums text-ink">
                      {formatMoney(Math.abs(sub.amountCents), { forceCents: true })}
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
