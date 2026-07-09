"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRightLeft, ChevronDown, ChevronsUpDown, ChevronUp, Search } from "lucide-react";
import { DesktopEmpty } from "@/components/web/DesktopEmpty";
import { Checkbox } from "@/components/ui/Checkbox";
import { CategorizeBacklogButton } from "@/components/shared/CategorizeBacklogButton";
import { InlineCategoryPicker } from "@/components/shared/InlineCategoryPicker";
import { TxnTags } from "@/components/ui/TxnTags";
import { formatMoney } from "@/lib/format";
import {
  ALL_MONTHS_FILTERS,
  TXN_TYPE_CHIPS,
  filterTransactions,
  sortTransactions,
  type SortKey,
} from "@/lib/search";
import { resolveViewMonth } from "@/lib/trends";
import type { Transaction } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

const COLUMNS: { key: SortKey; label: string; align?: string }[] = [
  { key: "merchant", label: "Merchant" },
  { key: "category", label: "Category" },
  { key: "date", label: "Date" },
  { key: "amount", label: "Amount", align: "justify-end text-right" },
];

// Shared grid template so header + rows align (checkbox / merchant / category /
// date / amount) — mirrors the design's `32px 2.4fr 2fr 1fr 1fr`.
const GRID = "grid grid-cols-[32px_2.4fr_2fr_1fr_1fr] items-center";

// Virtualization: past this many rows, render only the visible window inside a
// scroll box (fixed row height) so a 5,000-row list stays smooth.
const ROW_HEIGHT = 53;
const VIEWPORT_H = 560;
const OVERSCAN = 6;
const VIRTUALIZE_THRESHOLD = 100;

export function Transactions() {
  const {
    transactions,
    categories,
    viewMonthKey,
    webTxnQuery,
    webTxnType,
    txnCategory,
    webSortKey,
    webSortDir,
    set,
    bulkCategorize,
  } = useStore(
    useShallow((s) => ({
      transactions: s.transactions,
      categories: s.categories,
      viewMonthKey: s.viewMonthKey,
      webTxnQuery: s.webTxnQuery,
      webTxnType: s.webTxnType,
      txnCategory: s.txnCategory,
      webSortKey: s.webSortKey,
      webSortDir: s.webSortDir,
      set: s.set,
      bulkCategorize: s.bulkCategorize,
    })),
  );
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
    categoryId: txnCategory === "all" ? null : txnCategory,
    monthKey: ALL_MONTHS_FILTERS.has(webTxnType) ? undefined : monthKey,
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

  // Windowed rendering for large result sets. Reset the scroll to the top
  // whenever the result set changes so you're not stranded mid-list in a shorter
  // one — done imperatively (the resulting scroll event updates scrollTop).
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [webTxnType, txnCategory, webTxnQuery, webSortKey, webSortDir, monthKey]);

  const virtualize = rows.length > VIRTUALIZE_THRESHOLD;
  // Clamp in case state lags a shrinking list for a frame.
  const clampedTop = Math.min(scrollTop, Math.max(0, rows.length * ROW_HEIGHT - VIEWPORT_H));
  const start = virtualize ? Math.max(0, Math.floor(clampedTop / ROW_HEIGHT) - OVERSCAN) : 0;
  const end = virtualize
    ? Math.min(rows.length, Math.ceil((clampedTop + VIEWPORT_H) / ROW_HEIGHT) + OVERSCAN)
    : rows.length;
  const visibleRows = rows.slice(start, end);

  const renderRow = (txn: Transaction) => {
    const openEdit = () => set({ webEditTxnId: txn.id });
    const isSelected = selected.has(txn.id);
    return (
      <div
        key={txn.id}
        style={{ height: ROW_HEIGHT }}
        className={`txrow ${GRID} cursor-pointer border-t border-edge px-1 transition ${
          isSelected ? "bg-track" : "hover:bg-track"
        }`}
      >
        <span className="flex h-full items-center">
          <Checkbox
            checked={isSelected}
            onChange={() => toggleOne(txn.id)}
            label={`Select ${txn.merchant}`}
          />
        </span>
        <button
          type="button"
          onClick={openEdit}
          className="flex h-full min-w-0 items-center gap-[11px] pr-2 text-left"
        >
          <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] bg-track text-[11px] font-semibold">
            {txn.merchant.charAt(0).toUpperCase()}
          </span>
          <span className="truncate text-[13.5px] font-semibold">{txn.merchant}</span>
          <TxnTags txn={txn} />
        </button>
        <div className="flex h-full items-center pr-2 text-[13px]">
          <InlineCategoryPicker txn={txn} />
        </div>
        <button
          type="button"
          onClick={openEdit}
          className="flex h-full items-center text-left text-[12.5px] font-medium text-muted"
        >
          {txn.dateLabel}
        </button>
        <button
          type="button"
          onClick={openEdit}
          className={`flex h-full items-center justify-end text-right text-[13.5px] font-semibold tabular-nums ${
            txn.isIncome ? "text-green" : ""
          }`}
        >
          {formatMoney(txn.amountCents, { signed: true })}
        </button>
      </div>
    );
  };

  return (
    <div className="mt-[18px] flex min-h-0 flex-1 flex-col">
      {/* Search + AI categorize */}
      <div className="flex items-center gap-2.5">
        <div className="flex flex-1 items-center gap-2 rounded-[10px] border border-edge px-[13px] py-[9px]">
          <Search size={15} strokeWidth={2} className="flex-none text-muted" />
          <input
            value={webTxnQuery}
            onChange={(e) => set({ webTxnQuery: e.target.value })}
            placeholder="Search transactions or categories…"
            className="flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
          />
        </div>
        <CategorizeBacklogButton />
      </div>

      {/* Filter pills + category dropdown */}
      <div className="mt-3 flex flex-wrap items-center gap-[9px]">
        {TXN_TYPE_CHIPS.map((chip) => (
          <button
            key={chip.value}
            type="button"
            onClick={() => set({ webTxnType: chip.value })}
            className={`whitespace-nowrap rounded-full px-[13px] py-[7px] text-[12px] transition ${
              webTxnType === chip.value
                ? "bg-primary font-semibold text-onprimary"
                : "border border-edge font-medium text-muted hover:text-ink"
            }`}
          >
            {chip.label}
            {chip.value === "uncategorized" && uncategorizedCount > 0
              ? ` ${uncategorizedCount}`
              : ""}
          </button>
        ))}
        <div className="relative ml-auto">
          <select
            value={txnCategory}
            onChange={(e) => set({ txnCategory: e.target.value })}
            aria-label="Filter by category"
            className={`cursor-pointer appearance-none rounded-[10px] border bg-bg py-2 pl-[13px] pr-9 text-[12.5px] font-medium outline-none ${
              txnCategory === "all" ? "border-edge text-ink" : "border-primary text-primary"
            }`}
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            strokeWidth={2}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          />
        </div>
      </div>

      {/* Bulk-categorize bar (multi-select) */}
      {selected.size > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-[10px] border border-edge bg-track px-4 py-3">
          <span className="text-[13px] font-semibold">{selected.size} selected</span>
          <span className="text-[12.5px] text-muted">Set category to</span>
          <select
            value={bulkCategoryId}
            onChange={(e) => setBulkCategoryId(e.target.value)}
            className="rounded-[8px] border border-edge bg-card px-2 py-1.5 text-[12.5px] font-medium outline-none"
          >
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={applyBulk}
            disabled={applying}
            className="rounded-[8px] bg-primary px-3.5 py-1.5 text-[12.5px] font-semibold text-onprimary disabled:opacity-50"
          >
            {applying ? "Applying…" : "Apply"}
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="ml-auto text-[12.5px] font-medium text-muted hover:text-ink"
          >
            Clear
          </button>
        </div>
      )}

      {/* Empty state — no transactions at all, or none matching the filters. */}
      {rows.length === 0 ? (
        transactions.length === 0 ? (
          <DesktopEmpty
            icon={ArrowRightLeft}
            title="No transactions yet"
            description="Connect an account or import a CSV, and your transactions will show up here."
          >
            <button
              type="button"
              onClick={() => set({ webView: "import" })}
              className="rounded-[10px] bg-primary px-5 py-[11px] text-[13px] font-semibold text-onprimary"
            >
              Import CSV
            </button>
            <button
              type="button"
              onClick={() => set({ webAddOpen: true })}
              className="rounded-[10px] border border-edge px-5 py-[11px] text-[13px] font-semibold"
            >
              Add manually
            </button>
          </DesktopEmpty>
        ) : (
          <DesktopEmpty
            icon={Search}
            title="No matching transactions"
            description="No transactions match your current search and filters. Try clearing them to see everything."
          >
            <button
              type="button"
              onClick={() => set({ webTxnQuery: "", webTxnType: "all", txnCategory: "all" })}
              className="rounded-[10px] bg-primary px-5 py-[11px] text-[13px] font-semibold text-onprimary"
            >
              Clear filters
            </button>
          </DesktopEmpty>
        )
      ) : (
        <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            className={`${GRID} select-none px-1 pb-2 text-[11px] font-semibold uppercase tracking-[.03em] text-muted`}
          >
            <Checkbox checked={allVisibleSelected} onChange={toggleAll} label="Select all" />
            {COLUMNS.map((col) => {
              const active = webSortKey === col.key;
              return (
                <button
                  key={col.key}
                  type="button"
                  onClick={() => sortBy(col.key)}
                  title={`Sort by ${col.label.toLowerCase()}`}
                  className={`flex items-center gap-1 ${col.align ?? ""} ${active ? "text-ink" : ""}`}
                >
                  {col.label.toUpperCase()}
                  {active ? (
                    webSortDir === "asc" ? (
                      <ChevronUp size={11} strokeWidth={2.5} />
                    ) : (
                      <ChevronDown size={11} strokeWidth={2.5} />
                    )
                  ) : (
                    <ChevronsUpDown size={11} strokeWidth={2.5} className="opacity-70" />
                  )}
                </button>
              );
            })}
          </div>

          {virtualize ? (
            <div
              ref={scrollRef}
              onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
              className="min-h-0 flex-1 overflow-y-auto"
            >
              {/* Full-height spacer preserves the scrollbar; the window is offset in. */}
              <div style={{ height: rows.length * ROW_HEIGHT, position: "relative" }}>
                <div style={{ transform: `translateY(${start * ROW_HEIGHT}px)` }}>
                  {visibleRows.map(renderRow)}
                </div>
              </div>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto">{rows.map(renderRow)}</div>
          )}

          <div className="border-t border-edge pt-3 text-[11px] font-medium text-muted">
            {filtered.length} transactions · {formatMoney(total, { signed: true })}
          </div>
        </div>
      )}
    </div>
  );
}
