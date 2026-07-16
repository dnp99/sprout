"use client";

import { ArrowLeftRight, ArrowUpDown, ChevronDown, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { CategorizeBacklogButton } from "@/components/shared/CategorizeBacklogButton";
import { StatCard } from "@/components/ui/StatCard";
import { TransactionCard } from "@/components/ui/rows";
import { formatMoney } from "@/lib/format";
import {
  ALL_MONTHS_FILTERS,
  TXN_SORTS,
  TXN_TYPE_CHIPS,
  type TxnSort,
  filterTransactions,
  sortTransactions,
} from "@/lib/search";
import { monthTotals, resolveViewMonth } from "@/lib/trends";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "next-intl";

// Single-line, horizontally-scrollable chip row (no wrapping, hidden scrollbar).
const SCROLL_ROW =
  "flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export function Activity() {
  const t = useTranslations("txns");
  const {
    transactions,
    categories,
    viewMonthKey,
    searchType,
    txnCategory,
    set,
    goMobile,
    openTransaction,
    bulkDelete,
  } = useStore(
    useShallow((s) => ({
      transactions: s.transactions,
      categories: s.categories,
      viewMonthKey: s.viewMonthKey,
      searchType: s.searchType,
      txnCategory: s.txnCategory,
      set: s.set,
      goMobile: s.goMobile,
      openTransaction: s.openTransaction,
      bulkDelete: s.bulkDelete,
    })),
  );

  const [sort, setSort] = useState<TxnSort>("newest");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const monthKey = resolveViewMonth(viewMonthKey, transactions);
  // Uncategorized/Excluded are a whole-backlog review, so they ignore the month.
  const allMonths = ALL_MONTHS_FILTERS.has(searchType);
  const filtered = filterTransactions(transactions, {
    type: searchType,
    categoryId: txnCategory === "all" ? null : txnCategory,
    monthKey: allMonths ? undefined : monthKey,
  });
  const sortMeta = TXN_SORTS.find((s) => s.value === sort) ?? TXN_SORTS[0];
  const rows = sortTransactions(filtered, sortMeta.key, sortMeta.dir);
  const uncategorizedCount = filterTransactions(transactions, { type: "uncategorized" }).length;
  const { spentCents, incomeCents } = monthTotals(transactions, monthKey);

  const allSelected = rows.length > 0 && rows.every((t) => selected.has(t.id));
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((t) => t.id)));
  const exitSelect = () => {
    setSelectMode(false);
    setSelected(new Set());
    setConfirmDelete(false);
  };
  async function deleteSelected() {
    setDeleting(true);
    try {
      await bulkDelete([...selected]);
      exitSelect();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col px-4 pt-1.5">
      {/* Full-width search — tapping it opens its own screen. */}
      <button
        type="button"
        onClick={() => goMobile("search")}
        className="flex h-11 w-full items-center gap-[7px] rounded-[10px] border border-edge px-3 text-left"
      >
        <Search size={14} strokeWidth={2} className="flex-none text-muted" />
        <span className="text-[12px] font-medium text-muted">Search</span>
      </button>

      <div className={`mt-2.5 ${SCROLL_ROW}`}>
        {TXN_TYPE_CHIPS.map((chip) => {
          const active = searchType === chip.value;
          const count =
            chip.value === "uncategorized" && uncategorizedCount > 0
              ? ` ${uncategorizedCount}`
              : "";
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => set({ searchType: chip.value })}
              className={`shrink-0 whitespace-nowrap rounded-[10px] border px-3 py-2 text-[12px] transition ${
                active
                  ? "border-primary bg-primary font-semibold text-onprimary"
                  : "border-edge font-medium text-muted"
              }`}
            >
              {t(chip.labelKey)}
              {count}
            </button>
          );
        })}
      </div>

      {/* Category filter + sort share a row. */}
      <div className="mt-2.5 flex items-center gap-2">
        <div className="relative flex-1">
          <select
            value={txnCategory}
            onChange={(e) => set({ txnCategory: e.target.value })}
            aria-label="Filter by category"
            className={`h-11 w-full appearance-none rounded-[10px] border px-3 pr-9 text-[12px] font-medium outline-none ${
              txnCategory === "all"
                ? "border-edge bg-card text-ink"
                : "border-primary bg-primary-soft text-primary-dark"
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
        <div className="relative flex-none">
          <ArrowUpDown
            size={13}
            strokeWidth={2}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as TxnSort)}
            aria-label="Sort transactions"
            className="h-11 appearance-none rounded-[10px] border border-edge bg-card pl-[30px] pr-3 text-[12px] font-semibold text-ink outline-none"
          >
            {TXN_SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {searchType === "uncategorized" && <CategorizeBacklogButton className="mt-3" />}

      {/* Spent/Income summary applies only to month-scoped filters. */}
      {!allMonths && (
        <div className="mt-3 flex gap-2.5">
          <StatCard label="Spent" value={formatMoney(spentCents)} className="flex-1" />
          <StatCard
            label="Income"
            value={formatMoney(incomeCents)}
            variant="income"
            className="flex-1"
          />
        </div>
      )}

      {/* Multi-select: a subtle "Select" toggle, then a bulk-delete bar. */}
      {rows.length > 0 &&
        (selectMode ? (
          <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-edge bg-track px-3 py-2">
            <span className="text-[12.5px] font-semibold text-ink">{selected.size} selected</span>
            <button
              type="button"
              onClick={toggleAll}
              className="text-[12px] font-semibold text-primary"
            >
              {allSelected ? "None" : "All"}
            </button>
            <div className="ml-auto flex items-center gap-2">
              {confirmDelete ? (
                <>
                  <button
                    type="button"
                    onClick={() => void deleteSelected()}
                    disabled={deleting || selected.size === 0}
                    className="flex items-center gap-1 rounded-[8px] bg-primary px-3 py-1.5 text-[12px] font-semibold text-onprimary disabled:opacity-50"
                  >
                    <Trash2 size={12} strokeWidth={2.2} />
                    {deleting ? "Deleting…" : `Delete ${selected.size}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="text-[12px] font-medium text-muted"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => selected.size > 0 && setConfirmDelete(true)}
                    disabled={selected.size === 0}
                    className="flex items-center gap-1 rounded-[8px] border border-edge px-3 py-1.5 text-[12px] font-semibold text-primary disabled:opacity-40"
                  >
                    <Trash2 size={12} strokeWidth={2.2} /> Delete
                  </button>
                  <button
                    type="button"
                    onClick={exitSelect}
                    className="text-[12px] font-medium text-muted"
                  >
                    Done
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => setSelectMode(true)}
              className="text-[12px] font-semibold text-primary"
            >
              Select
            </button>
          </div>
        ))}

      {rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-track">
            <ArrowLeftRight size={26} strokeWidth={1.8} className="text-muted" />
          </span>
          <div className="mt-4 text-[15px] font-semibold text-ink">
            No transactions{allMonths ? " yet" : " this month"}
          </div>
          <div className="mt-1 text-[12px] font-medium leading-relaxed text-muted">
            Add your first transaction and it&rsquo;ll show up here.
          </div>
        </div>
      ) : (
        <div className="mt-2.5 flex flex-col gap-2.5">
          {rows.map((txn) => (
            <TransactionCard
              key={txn.id}
              txn={txn}
              selectable={selectMode}
              selected={selected.has(txn.id)}
              onToggle={() => toggleOne(txn.id)}
              onClick={() => openTransaction(txn.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
