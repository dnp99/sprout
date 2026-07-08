"use client";

import { useMemo, useState } from "react";
import { EXPORT_RANGES, type ExportRange, exportRangeStart } from "@/lib/export";
import { useStore } from "@/state/store";

/** CSV export UI (shared by web + mobile): pick a date range, preview the row
 *  count, and download. The download hits GET /api/export for the full set; the
 *  preview count is from the loaded store. */
export function ExportPanel() {
  const transactions = useStore((s) => s.transactions);
  const [range, setRange] = useState<ExportRange>("month");

  const count = useMemo(() => {
    const start = exportRangeStart(range);
    if (!start) return transactions.length;
    return transactions.filter((t) => new Date(t.occurredAt) >= start).length;
  }, [transactions, range]);

  function download() {
    const a = document.createElement("a");
    a.href = `/api/export?range=${range}`;
    a.download = `sprout-transactions-${range}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div>
      <div className="rounded-[22px] bg-card p-5">
        <div className="text-[11px] font-extrabold uppercase tracking-wide text-muted">
          Date range
        </div>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {EXPORT_RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRange(r.value)}
              className={`rounded-full px-4 py-2 text-[12.5px] font-bold ${
                range === r.value ? "bg-primary text-white" : "bg-track text-muted"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="mt-4 text-[11px] font-extrabold uppercase tracking-wide text-muted">
          Format
        </div>
        <div className="mt-2.5 inline-flex rounded-xl bg-track px-3 py-1.5 text-[12.5px] font-bold text-ink">
          CSV
        </div>
      </div>

      <div className="mt-3.5 flex items-center gap-3.5 rounded-[18px] border border-edge bg-[#faf4ea] p-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e4ebd6] text-[22px]">
          📄
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-extrabold text-ink">sprout-transactions.csv</div>
          <div className="text-[11.5px] font-semibold text-muted">
            {count} transactions · Date, Merchant, Category, Amount
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={download}
        disabled={count === 0}
        className="mt-4 w-full rounded-2xl bg-primary py-3.5 text-[15px] font-extrabold text-white disabled:opacity-50"
      >
        ⬇️ Export {count} transactions
      </button>
    </div>
  );
}
