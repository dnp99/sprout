"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRightLeft,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Search,
  Trash2,
} from "lucide-react";
import { DesktopEmpty } from "@/components/web/DesktopEmpty";
import { Checkbox } from "@/components/ui/Checkbox";
import { CategorizeBacklogButton } from "@/components/shared/CategorizeBacklogButton";
import { InlineCategoryPicker } from "@/components/shared/InlineCategoryPicker";
import { TxnTags } from "@/components/ui/TxnTags";
import { TransactionCategoryFilter } from "@/components/web/TransactionCategoryFilter";
import { formatMoney } from "@/lib/format";
import {
  TXN_TYPE_CHIPS,
  filterTransactions,
  sortTransactions,
  type SortKey,
  webTransactionMonthKey,
} from "@/lib/search";
import { resolveViewMonth } from "@/lib/trends";
import type { Transaction } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { useFormatters } from "@/i18n/useFormatters";
import { useTranslations } from "next-intl";

const COLUMNS: { key: SortKey; label: string; align?: string }[] = [
  { key: "merchant", label: "colMerchant" },
  { key: "category", label: "colCategory" },
  { key: "date", label: "colDate" },
  { key: "amount", label: "colAmount", align: "justify-end pr-2 text-right" },
];

// Shared grid template so header + rows align (checkbox / merchant / category /
// date / amount) — mirrors the design's `32px 2.4fr 2fr 1fr 1fr`.
const GRID =
  "grid grid-cols-[32px_minmax(0,2.4fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] items-center";

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
    bulkDelete,
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
      bulkDelete: s.bulkDelete,
    })),
  );
  const monthKey = resolveViewMonth(viewMonthKey, transactions);

  // Multi-select for bulk actions (ephemeral UI state).
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [applying, setApplying] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Free-text search spans all loaded history. With no query, the regular table
  // follows the month stepper while backlog filters remain all-month views.
  const scopeRows = filterTransactions(transactions, {
    query: webTxnQuery,
    type: webTxnType,
    monthKey: webTransactionMonthKey(webTxnQuery, webTxnType, monthKey),
  });
  const filtered = filterTransactions(scopeRows, {
    categoryId: txnCategory === "all" ? null : txnCategory,
  });
  const rows = sortTransactions(filtered, webSortKey, webSortDir);
  const total = filtered.reduce((sum, t) => sum + t.amountCents, 0);
  const uncategorizedCount = filterTransactions(transactions, { type: "uncategorized" }).length;
  const categoryCounts = new Map<string, number>();
  scopeRows.forEach((txn) => {
    if (txn.categoryId) {
      categoryCounts.set(txn.categoryId, (categoryCounts.get(txn.categoryId) ?? 0) + 1);
    }
  });

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
  const clearSelection = () => {
    setSelected(new Set());
    setConfirmDelete(false);
  };

  async function applyBulk() {
    setApplying(true);
    try {
      await bulkCategorize([...selected], bulkCategoryId || null);
      clearSelection();
      setBulkCategoryId("");
    } finally {
      setApplying(false);
    }
  }

  async function deleteSelected() {
    setDeleting(true);
    try {
      await bulkDelete([...selected]);
      clearSelection();
    } finally {
      setDeleting(false);
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

  const fmt = useFormatters();
  const t = useTranslations("txns");
  const searchingAllDates = webTxnQuery.trim().length > 0;
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
          {searchingAllDates ? fmt.txnSearchDate(txn.occurredAt) : fmt.txnDate(txn.occurredAt)}
        </button>
        <button
          type="button"
          onClick={openEdit}
          className={`flex h-full items-center justify-end pr-2 text-right text-[13.5px] font-semibold tabular-nums ${
            txn.isIncome ? "text-green" : ""
          }`}
        >
          {formatMoney(txn.amountCents, { signed: true })}
        </button>
      </div>
    );
  };

  return (
    <div className="mt-[18px] grid min-h-0 flex-1 grid-cols-[190px_minmax(0,1fr)] gap-[14px] xl:grid-cols-[230px_minmax(0,1fr)]">
      <TransactionCategoryFilter
        categories={categories}
        activeId={txnCategory}
        totalCount={scopeRows.length}
        counts={categoryCounts}
        onSelect={(categoryId) => set({ txnCategory: categoryId })}
      />

      <section className="flex min-h-0 min-w-0 flex-col">
        {/* Search + AI categorize */}
        <div className="flex items-center gap-2.5">
          <div className="flex flex-1 items-center gap-2 rounded-[10px] border border-edge px-[13px] py-[9px] transition focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
            <Search size={15} strokeWidth={2} className="flex-none text-muted" />
            <input
              value={webTxnQuery}
              onChange={(e) => set({ webTxnQuery: e.target.value })}
              placeholder={t("searchPlaceholder")}
              className="flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
            />
          </div>
          <CategorizeBacklogButton />
        </div>

        {/* Transaction-type filters; categories live in the left column. */}
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
              {t(chip.labelKey)}
              {chip.value === "uncategorized" && uncategorizedCount > 0
                ? ` ${uncategorizedCount}`
                : ""}
            </button>
          ))}
        </div>

        {/* Bulk-categorize bar (multi-select) */}
        {selected.size > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-[10px] border border-edge bg-track px-4 py-3">
            <span className="text-[13px] font-semibold">
              {t("selectedN", { count: selected.size })}
            </span>
            <span className="text-[12.5px] text-muted">Set category to</span>
            <select
              value={bulkCategoryId}
              onChange={(e) => setBulkCategoryId(e.target.value)}
              className="rounded-[8px] border border-edge bg-card px-2 py-1.5 text-[12.5px] font-medium outline-none"
            >
              <option value="">{t("uncategorized")}</option>
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
              {applying ? t("applying") : t("apply")}
            </button>

            {/* Bulk delete — two-step confirm (destructive). */}
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={deleteSelected}
                  disabled={deleting}
                  className="flex items-center gap-1.5 rounded-[8px] bg-primary px-3.5 py-1.5 text-[12.5px] font-semibold text-onprimary disabled:opacity-50"
                >
                  <Trash2 size={13} strokeWidth={2} />
                  {deleting ? t("deleting") : t("deleteN", { count: selected.size })}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-[12.5px] font-medium text-muted hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 rounded-[8px] border border-edge px-3 py-1.5 text-[12.5px] font-semibold text-primary transition hover:border-soft-border"
              >
                <Trash2 size={13} strokeWidth={2} /> Delete
              </button>
            )}

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
              title={t("emptyTitle")}
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
            <DesktopEmpty icon={Search} title={t("noMatchTitle")} description={t("noMatchBody")}>
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
              <Checkbox checked={allVisibleSelected} onChange={toggleAll} label={t("selectAll")} />
              {COLUMNS.map((col) => {
                const active = webSortKey === col.key;
                const filtered = col.key === "category" && txnCategory !== "all";
                return (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() => sortBy(col.key)}
                    title={t("sortBy", { column: t(col.label).toLowerCase() })}
                    className={`flex items-center gap-1 ${col.align ?? ""} ${
                      filtered ? "text-primary" : active ? "text-ink" : ""
                    }`}
                  >
                    {t(col.label).toUpperCase()}
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

            <div className="flex items-center justify-between gap-4 border-t border-edge pt-3">
              <span className="text-[12px] font-medium text-muted">
                {t("summaryCount", { count: filtered.length })}
              </span>
              <span
                className={`text-[16px] font-bold tabular-nums ${total >= 0 ? "text-green" : "text-ink"}`}
              >
                {fmt.money(total, { signed: true })}
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
