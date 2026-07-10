"use client";

import { useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
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
    <div className="space-y-4">
      <div className="rounded-[18px] border border-edge bg-card p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[.08em] text-muted">
              Export settings
            </div>
            <div className="mt-1 text-[18px] font-bold tracking-[-.02em] text-ink">
              Download your transaction history
            </div>
            <p className="mt-1.5 max-w-[34rem] text-[13px] font-medium leading-relaxed text-muted">
              Export a clean CSV with date, merchant, category, and signed amount columns so you can
              archive it or move it into another tool.
            </p>
          </div>
          <div className="inline-flex rounded-[11px] border border-edge bg-track px-3.5 py-2 text-[12.5px] font-semibold text-ink">
            CSV format
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[.05em] text-muted">
              Date range
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {EXPORT_RANGES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRange(r.value)}
                  className={`rounded-full px-4 py-2 text-[12.5px] font-semibold transition ${
                    range === r.value
                      ? "bg-primary text-onprimary"
                      : "bg-track text-muted hover:text-ink"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[14px] border border-edge bg-track/40 p-4">
            <div className="text-[11px] font-bold uppercase tracking-[.05em] text-muted">
              Included
            </div>
            <div className="mt-1 text-[27px] font-bold tracking-[-.03em] tabular-nums text-ink">
              {count}
            </div>
            <div className="mt-1 text-[12px] font-medium text-muted">
              transactions in this export
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3.5 rounded-[18px] border border-edge bg-card p-4">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[12px] bg-track text-muted">
          <FileText size={20} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-ink">sprout-transactions.csv</div>
          <div className="mt-0.5 text-[12px] font-medium leading-relaxed text-muted">
            {count} transactions · Date, Merchant, Category, Amount
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={download}
        disabled={count === 0}
        className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-primary py-3.5 text-[14px] font-semibold text-onprimary transition disabled:opacity-50"
      >
        <Download size={16} strokeWidth={2.2} />
        Export {count} transactions
      </button>
    </div>
  );
}
