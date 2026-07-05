"use client";

import { BarChart } from "@/components/ui/BarChart";
import { formatMoney } from "@/lib/format";
import { mockTopMovers, mockTrend } from "@/lib/mock";
import { useStore } from "@/state/store";

export function Trends() {
  const { summary } = useStore();
  const netCents = summary.incomeCents - summary.spentCents;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[20px] bg-card p-6">
        <div className="flex justify-between">
          <span className="text-[15px] font-extrabold text-ink">Spending, last 6 months</span>
          <span className="text-[22px] font-extrabold tabular-nums text-ink">
            {formatMoney(summary.spentCents)} <span className="text-[13px] text-green">↓ 8%</span>
          </span>
        </div>
        <div className="mt-5">
          <BarChart points={mockTrend} height={190} />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 rounded-[20px] bg-card p-6">
          <div className="mb-4 text-sm font-extrabold text-ink">Income vs spending</div>
          <div className="flex h-[150px] items-end justify-center gap-8">
            <div className="flex h-full flex-col items-center justify-end gap-2">
              <div className="w-[70px] rounded-[10px] bg-green" style={{ height: "100%" }} />
              <span className="text-xs font-extrabold text-[#4f7a3a]">
                Income {formatMoney(summary.incomeCents)}
              </span>
            </div>
            <div className="flex h-full flex-col items-center justify-end gap-2">
              <div className="w-[70px] rounded-[10px] bg-primary" style={{ height: "101%" }} />
              <span className="text-xs font-extrabold text-primary-dark">
                Spent {formatMoney(summary.spentCents)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 rounded-[20px] bg-card p-6">
          <div className="mb-4 text-sm font-extrabold text-ink">Top movers</div>
          <div className="flex flex-col gap-4 text-sm">
            {mockTopMovers.map((mover) => (
              <div key={mover.name} className="flex justify-between">
                <span className="font-bold">
                  {mover.emoji} {mover.name}
                </span>
                <span
                  className="font-extrabold"
                  style={{ color: mover.deltaCents > 0 ? "#c25b3a" : "#4f7a3a" }}
                >
                  {mover.deltaCents > 0 ? "↑" : "↓"} {formatMoney(Math.abs(mover.deltaCents))}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-between border-t border-track pt-4 text-sm">
            <span className="font-extrabold">Net this month</span>
            <span className="font-extrabold tabular-nums">
              {formatMoney(netCents, { signed: true })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
