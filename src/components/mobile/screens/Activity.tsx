"use client";

import { ArrowLeftRight, ChevronDown, Search } from "lucide-react";
import { CategorizeBacklogButton } from "@/components/shared/CategorizeBacklogButton";
import { StatCard } from "@/components/ui/StatCard";
import { TransactionCard } from "@/components/ui/rows";
import { formatMoney } from "@/lib/format";
import { ALL_MONTHS_FILTERS, TXN_TYPE_CHIPS, filterTransactions } from "@/lib/search";
import { monthTotals, resolveViewMonth } from "@/lib/trends";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

// Single-line, horizontally-scrollable chip row (no wrapping, hidden scrollbar).
const SCROLL_ROW =
  "flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export function Activity() {
  const {
    transactions,
    categories,
    viewMonthKey,
    searchType,
    txnCategory,
    set,
    goMobile,
    openTransaction,
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
    })),
  );

  const monthKey = resolveViewMonth(viewMonthKey, transactions);
  // Uncategorized/Excluded are a whole-backlog review, so they ignore the month.
  const allMonths = ALL_MONTHS_FILTERS.has(searchType);
  const rows = filterTransactions(transactions, {
    type: searchType,
    categoryId: txnCategory === "all" ? null : txnCategory,
    monthKey: allMonths ? undefined : monthKey,
  });
  const uncategorizedCount = filterTransactions(transactions, { type: "uncategorized" }).length;
  const { spentCents, incomeCents } = monthTotals(transactions, monthKey);

  return (
    <div className="flex min-h-full flex-col px-4 pt-3">
      {/* Search + category share a row (each ~half). Tapping search opens its
          own screen, so it doesn't need the full width. */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => goMobile("search")}
          className="flex h-11 flex-1 items-center gap-[7px] rounded-[10px] border border-edge px-3 text-left"
        >
          <Search size={14} strokeWidth={2} className="flex-none text-muted" />
          <span className="text-[12px] font-medium text-muted">Search</span>
        </button>
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
      </div>

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
              {chip.label}
              {count}
            </button>
          );
        })}
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
        <div className="mt-3 flex flex-col gap-2.5">
          {rows.map((txn) => (
            <TransactionCard key={txn.id} txn={txn} onClick={() => openTransaction(txn.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
