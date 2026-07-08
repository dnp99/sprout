"use client";

import { useState } from "react";
import { CategorizeBacklogButton } from "@/components/shared/CategorizeBacklogButton";
import { InlineCategoryPicker } from "@/components/shared/InlineCategoryPicker";
import { formatMoney } from "@/lib/format";
import { filterTransactions, sortTransactions, type SortKey } from "@/lib/search";
import { resolveViewMonth } from "@/lib/trends";
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
  const {
    transactions,
    categories,
    viewMonthKey,
    webTxnQuery,
    webTxnType,
    webSortKey,
    webSortDir,
    set,
    bulkCategorize,
  } = useStore();
  const monthKey = resolveViewMonth(viewMonthKey, transactions);

  // Multi-select for bulk categorization (ephemeral UI state).
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [applying, setApplying] = useState(false);

  // Reviewing uncategorized is a whole-backlog pass, not a monthly view — the
  // Overview alert counts every month, so the list must show every month too.
  const filtered = filterTransactions(transactions, {
    query: webTxnQuery,
    type: webTxnType,
    monthKey: webTxnType === "uncategorized" ? undefined : monthKey,
  });
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

  const allVisibleSelected = rows.length > 0 && rows.every((t) => selected.has(t.id));
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected((prev) => {
      if (rows.every((t) => prev.has(t.id))) {
        const next = new Set(prev);
        rows.forEach((t) => next.delete(t.id));
        return next;
      }
      return new Set([...prev, ...rows.map((t) => t.id)]);
    });
  const clearSelection = () => setSelected(new Set());

  async function applyBulk() {
    setApplying(true);
    try {
      await bulkCategorize([...selected], bulkCategoryId || null);
      setSelected(new Set());
      setBulkCategoryId("");
    } finally {
      setApplying(false);
    }
  }

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
        <CategorizeBacklogButton />
      </div>

      {selected.size > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl bg-surface px-4 py-3">
          <span className="text-[13px] font-extrabold text-white">{selected.size} selected</span>
          <span className="text-[12.5px] font-semibold text-white/70">Set category to</span>
          <select
            value={bulkCategoryId}
            onChange={(e) => setBulkCategoryId(e.target.value)}
            className="rounded-lg bg-white/15 px-2 py-1.5 text-[12.5px] font-bold text-white outline-none"
          >
            <option value="" className="text-ink">
              Uncategorized
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="text-ink">
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={applyBulk}
            disabled={applying}
            className="rounded-lg bg-primary px-3.5 py-1.5 text-[12.5px] font-extrabold text-white disabled:opacity-50"
          >
            {applying ? "Applying…" : "Apply"}
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="ml-auto text-[12.5px] font-bold text-white/70 hover:text-white"
          >
            Clear
          </button>
        </div>
      )}

      <div className="mt-4 rounded-[20px] bg-card px-6 pb-3.5 pt-2">
        <div className="flex select-none border-b-2 border-track pb-2.5 pt-3.5 text-[11px] font-extrabold uppercase">
          <label className="flex w-9 flex-none cursor-pointer items-center">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleAll}
              aria-label="Select all"
              className="h-4 w-4 accent-primary"
            />
          </label>
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

        {rows.map((txn) => {
          const openEdit = () => set({ webEditTxnId: txn.id });
          const isSelected = selected.has(txn.id);
          return (
            <div
              key={txn.id}
              className={`flex w-full items-center border-b border-[#f7efe3] text-[13.5px] transition last:border-0 ${
                isSelected ? "bg-peach-soft/40" : "hover:bg-[#faf5ec]"
              }`}
            >
              <label className="flex w-9 flex-none cursor-pointer items-center py-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleOne(txn.id)}
                  aria-label={`Select ${txn.merchant}`}
                  className="h-4 w-4 accent-primary"
                />
              </label>
              <button
                type="button"
                onClick={openEdit}
                className="flex flex-[2] items-center gap-2.5 py-3 text-left font-bold"
              >
                <span className="text-lg">{txn.emoji}</span>
                {txn.merchant}
              </button>
              <div className="flex flex-[1.2] items-center pr-2">
                <InlineCategoryPicker txn={txn} />
              </div>
              <button
                type="button"
                onClick={openEdit}
                className="flex-1 py-3 text-left font-semibold text-muted"
              >
                {txn.dateLabel}
              </button>
              <button
                type="button"
                onClick={openEdit}
                className={`flex-1 py-3 text-right font-extrabold tabular-nums ${txn.isIncome ? "text-[#4f7a3a]" : "text-ink"}`}
              >
                {formatMoney(txn.amountCents, { signed: true })}
              </button>
            </div>
          );
        })}

        <div className="pt-3.5 text-xs font-bold text-muted">
          {filtered.length} transactions · {formatMoney(total, { signed: true })}
        </div>
      </div>
    </div>
  );
}
