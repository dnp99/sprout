"use client";

import { BarChart } from "@/components/ui/BarChart";
import { StatCard } from "@/components/ui/StatCard";
import { formatMoney } from "@/lib/format";
import { mockTrend } from "@/lib/mock";
import { useStore } from "@/state/store";

export function Trends() {
  const { summary } = useStore();

  return (
    <div className="px-[22px] pt-3">
      <h1 className="text-[22px] font-extrabold text-ink">Trends 📈</h1>

      <div className="mt-4 rounded-card bg-card p-5">
        <div className="text-[12.5px] font-bold text-muted">Spending, 6 months</div>
        <div className="mt-0.5 text-[28px] font-extrabold tabular-nums text-ink">
          {formatMoney(summary.spentCents)}{" "}
          <span className="text-xs font-bold text-green">↓ 8%</span>
        </div>
        <div className="mt-4">
          <BarChart points={mockTrend} showLabels={false} />
        </div>
      </div>

      <div className="mt-3.5 flex gap-3">
        <StatCard
          label="Income"
          value={formatMoney(summary.incomeCents)}
          variant="income"
          className="flex-1"
        />
        <StatCard
          label="Saved"
          value={formatMoney(summary.savedCents)}
          valueClassName="text-green"
          className="flex-1"
        />
      </div>
    </div>
  );
}
