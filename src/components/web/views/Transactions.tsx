"use client";

import { formatMoney } from "@/lib/format";
import { filterTransactions, sortTransactions, type SortKey } from "@/lib/search";
import type { TxnFilter } from "@/lib/types";
import { useStore } from "@/state/store";

const COLUMNS: { key: SortKey; label: string; flex: string; align?: string }[] = [
  { key: "merchant", label: "Merchant", flex: "flex-[2]" },
  { key: "category", label: "Category", flex: "flex-[1.2]" },
  { key: "date", label: "Date", flex: "flex-1" },
  { key: "amount", label: "Amount", flex: "flex-1", align: "text-right" },
];

const TYPE_CHIPS: { value: TxnFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "expense", label: "💸 Expenses" },
  { value: "income", label: "💰 Income" },
  { value: "uncategorized", label: "🏷️ Uncategorized" },
];

export function Transactions() {
  const { transactions, webTxnQuery, webTxnType, webSortKey, webSortDir, set } = useStore();

  const filtered = filterTransactions(transactions, { query: webTxnQuery, type: webTxnType });
  const rows = sortTransactions(filtered, webSortKey, webSortDir);
  const total = filtered.reduce((sum, t) => sum + t.amountCents, 0);
  const uncategorizedCount = filterTransactions(transactions, { type: "uncategorized" }).length;

  const sortBy = (key: SortKey) => {
    if (webSortKey === key) {
      set({ webSortDir: webSortDir === "asc" ? "desc" : "asc" });
    } else {
      set({ webSortKey: key, webSortDir: key === "amount" || key === "date" ? "desc" : "asc" });
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-[220px] flex-1 items-center gap-2.5 rounded-[14px] bg-card px-4 py-2.5">
          <span>🔍</span>
          <input
            value={webTxnQuery}
            onChange={(e) => set({ webTxnQuery: e.target.value })}
            placeholder="Search transactions or categories…"
            className="flex-1 bg-transparent text-[13.5px] font-semibold text-ink outline-none placeholder:text-subtle"
          />
        </div>
        {TYPE_CHIPS.map((chip) => (
          <button
            key={chip.value}
            type="button"
            onClick={() => set({ webTxnType: chip.value })}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-[12.5px] transition ${
              webTxnType === chip.value
                ? "bg-primary font-extrabold text-white"
                : "border border-track bg-card font-bold text-ink/70"
            }`}
          >
            {chip.label}
            {chip.value === "uncategorized" && uncategorizedCount > 0
              ? ` (${uncategorizedCount})`
              : ""}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-[20px] bg-card px-6 pb-3.5 pt-2">
        <div className="flex select-none border-b-2 border-track pb-2.5 pt-3.5 text-[11px] font-extrabold uppercase">
          {COLUMNS.map((col) => {
            const active = webSortKey === col.key;
            return (
              <button
                key={col.key}
                type="button"
                onClick={() => sortBy(col.key)}
                className={`${col.flex} ${col.align ?? "text-left"}`}
                style={{ color: active ? "#d97a54" : "#a08d78" }}
              >
                {col.label}
                {active ? (webSortDir === "asc" ? " ↑" : " ↓") : ""}
              </button>
            );
          })}
        </div>

        {rows.map((txn) => (
          <div
            key={txn.id}
            className="flex items-center border-b border-[#f7efe3] py-3 text-[13.5px] last:border-0"
          >
            <span className="flex flex-[2] items-center gap-2.5 font-bold">
              <span className="text-lg">{txn.emoji}</span>
              {txn.merchant}
            </span>
            <span className="flex-[1.2] font-semibold text-muted">{txn.categoryName}</span>
            <span className="flex-1 font-semibold text-muted">{txn.dateLabel}</span>
            <span
              className={`flex-1 text-right font-extrabold tabular-nums ${txn.isIncome ? "text-[#4f7a3a]" : "text-ink"}`}
            >
              {formatMoney(txn.amountCents, { signed: true })}
            </span>
          </div>
        ))}

        <div className="pt-3.5 text-xs font-bold text-muted">
          {filtered.length} transactions · {formatMoney(total, { signed: true })}
        </div>
      </div>
    </div>
  );
}
