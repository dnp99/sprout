"use client";

import { BarChart } from "@/components/ui/BarChart";
import { Donut } from "@/components/ui/Donut";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatCard } from "@/components/ui/StatCard";
import { formatMoney } from "@/lib/format";
import { mockTrend, mockUpcomingBills, spendingDonutSegments } from "@/lib/mock";
import { useStore } from "@/state/store";

export function Overview() {
  const { summary, goals, transactions, set } = useStore();
  const recent = transactions.slice(0, 4);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <StatCard
          label="Safe to spend"
          value={formatMoney(summary.safeToSpendCents)}
          variant="primary"
          className="flex-1"
        />
        <StatCard label="Spent" value={formatMoney(summary.spentCents)} className="flex-1" />
        <StatCard
          label="Saved"
          value={formatMoney(summary.savedCents)}
          variant="income"
          className="flex-1"
        />
        <StatCard
          label="Income"
          value={formatMoney(summary.incomeCents)}
          valueClassName="text-[#4f7a3a]"
          className="flex-1"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-[1.6] rounded-[20px] bg-card p-6">
          <div className="flex justify-between">
            <span className="text-[15px] font-extrabold text-ink">Spending trend</span>
            <span className="text-xs font-extrabold text-green">↓ 8% vs May</span>
          </div>
          <div className="mt-5">
            <BarChart points={mockTrend} height={150} />
          </div>
        </div>
        <div className="flex-1 rounded-[20px] bg-card p-6">
          <div className="mb-4 text-[15px] font-extrabold text-ink">By category</div>
          <div className="flex justify-center">
            <Donut
              segments={spendingDonutSegments}
              size={132}
              thickness={25}
              topLabel="TOTAL"
              value={formatMoney(summary.spentCents)}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-[1.6] rounded-[20px] bg-card p-6">
          <div className="mb-3.5 flex items-center justify-between">
            <span className="text-[15px] font-extrabold text-ink">Recent transactions</span>
            <button
              type="button"
              onClick={() => set({ webView: "transactions" })}
              className="text-xs font-extrabold text-primary"
            >
              View all ›
            </button>
          </div>
          {recent.map((txn) => (
            <div
              key={txn.id}
              className="flex justify-between border-b border-track py-2.5 text-[13px] last:border-0"
            >
              <span className="font-bold">
                {txn.emoji} {txn.merchant}
              </span>
              <span className="text-muted">
                {txn.categoryName} · {txn.dateLabel}
              </span>
              <span
                className={`font-extrabold tabular-nums ${txn.isIncome ? "text-[#4f7a3a]" : "text-ink"}`}
              >
                {formatMoney(txn.amountCents, { signed: true })}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-1 flex-col gap-4">
          <div className="rounded-[20px] bg-card p-5">
            <div className="mb-3.5 text-sm font-extrabold text-ink">Goals</div>
            {goals.slice(0, 2).map((goal) => {
              const pct = Math.round((goal.savedCents / goal.targetCents) * 100);
              return (
                <div key={goal.id} className="mb-3.5 last:mb-0">
                  <div className="flex justify-between text-[12.5px] font-extrabold">
                    <span>
                      {goal.emoji} {goal.name}
                    </span>
                    <span className="text-muted">{pct}%</span>
                  </div>
                  <ProgressBar percent={pct} color={goal.color} height={7} className="mt-1.5" />
                </div>
              );
            })}
          </div>
          <div className="rounded-[20px] bg-card p-5">
            <div className="mb-3 text-sm font-extrabold text-ink">Upcoming bills</div>
            <div className="flex flex-col gap-2.5 text-[12.5px]">
              {mockUpcomingBills.map((bill) => (
                <div key={bill.id} className="flex justify-between">
                  <span className="font-bold">
                    {bill.emoji} {bill.name}
                  </span>
                  <span className={`font-bold ${bill.urgent ? "text-primary-dark" : "text-muted"}`}>
                    {bill.dueLabel.replace("in ", "in ").replace(" days", "d")} ·{" "}
                    {formatMoney(bill.amountCents, { forceCents: true })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
