"use client";

import { CategorizeBacklogButton } from "@/components/shared/CategorizeBacklogButton";
import { MonthStepper } from "@/components/shared/MonthStepper";
import { StatCard } from "@/components/ui/StatCard";
import { Chip } from "@/components/ui/controls";
import { TransactionCard } from "@/components/ui/rows";
import { formatMoney } from "@/lib/format";
import { ALL_MONTHS_FILTERS, TXN_TYPE_CHIPS, filterTransactions } from "@/lib/search";
import { monthTotals, resolveViewMonth } from "@/lib/trends";
import { useStore } from "@/state/store";

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
  } = useStore();

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
    <div className="px-[22px] pt-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => goMobile("home")}
          aria-label="Back"
          className="-mt-[3px] text-[28px] leading-none text-muted"
        >
          ‹
        </button>
        <h1 className="text-[22px] font-extrabold text-ink">Transactions</h1>
      </div>

      {/* Search + month selector share one row (search ~70%, month ~30%). For
          whole-backlog filters the month can't apply, so the slot shows an
          "All months" label instead of a stepper — the scope stays visible. */}
      <div className="mt-3.5 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => goMobile("search")}
          className="flex-[7] rounded-2xl bg-card px-4 py-2.5 text-left text-[13px] font-semibold text-subtle"
        >
          🔍 Search…
        </button>
        {allMonths ? (
          <div className="flex-[3] rounded-xl bg-card px-2 py-2 text-center text-[12px] font-bold text-muted">
            📅 All months
          </div>
        ) : (
          <MonthStepper compact className="flex-[3]" />
        )}
      </div>

      <div className={`mt-3 ${SCROLL_ROW}`}>
        {TXN_TYPE_CHIPS.map((chip) => (
          <Chip
            key={chip.value}
            active={searchType === chip.value}
            onClick={() => set({ searchType: chip.value })}
          >
            {chip.label}
            {chip.value === "uncategorized" && uncategorizedCount > 0
              ? ` (${uncategorizedCount})`
              : ""}
          </Chip>
        ))}
      </div>

      <select
        value={txnCategory}
        onChange={(e) => set({ txnCategory: e.target.value })}
        aria-label="Filter by category"
        className={`mt-2 w-full rounded-full border px-3.5 py-2 text-[12.5px] font-bold outline-none ${
          txnCategory === "all"
            ? "border-track bg-card text-ink/70"
            : "border-primary bg-primary/10 text-primary-dark"
        }`}
      >
        <option value="all">🏷️ All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.emoji} {c.name}
          </option>
        ))}
      </select>

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
        <div className="mt-8 text-center text-sm font-semibold text-muted">
          No transactions{allMonths ? "" : " this month"}.
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2.5">
          {rows.map((txn) => (
            <TransactionCard key={txn.id} txn={txn} onClick={() => openTransaction(txn.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
