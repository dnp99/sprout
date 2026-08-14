"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/controls";
import { SavedViews } from "@/components/web/SavedViews";
import { BackButton } from "@/components/ui/headers";
import { TransactionCard } from "@/components/ui/rows";
import { filterTransactions, summarizeResults } from "@/lib/search";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "next-intl";

// Type filtering lives on the Transactions screen now; Search is text + category.
export function Search() {
  const t = useTranslations("mobile");
  const {
    transactions,
    categories,
    searchQuery,
    searchCategoryId,
    searchCategoryIds,
    searchDateFrom,
    searchDateTo,
    searchAmountMin,
    searchAmountMax,
    set,
    goMobile,
    openTransaction,
  } = useStore(
    useShallow((s) => ({
      transactions: s.transactions,
      categories: s.categories,
      searchQuery: s.searchQuery,
      searchCategoryId: s.searchCategoryId,
      searchCategoryIds: s.searchCategoryIds,
      searchDateFrom: s.searchDateFrom,
      searchDateTo: s.searchDateTo,
      searchAmountMin: s.searchAmountMin,
      searchAmountMax: s.searchAmountMax,
      set: s.set,
      goMobile: s.goMobile,
      openTransaction: s.openTransaction,
    })),
  );

  // Chips built from the user's real categories (UUID ids) so the filter
  // actually matches transactions — hardcoded slugs never did.
  const categoryChips = [
    { id: "all", label: "All" },
    ...categories.map((c) => ({ id: c.id, label: `${c.emoji} ${c.name}` })),
  ];

  const results = filterTransactions(transactions, {
    query: searchQuery,
    categoryIds:
      searchCategoryIds.length > 0
        ? searchCategoryIds
        : searchCategoryId === "all"
          ? []
          : [searchCategoryId],
    dateFrom: searchDateFrom || undefined,
    dateTo: searchDateTo || undefined,
    amountMin: amountBoundToCents(searchAmountMin),
    amountMax: amountBoundToCents(searchAmountMax),
  });
  const searchingAllDates = searchQuery.trim().length > 0;

  // Collapse the category filter while actively typing so results get the room;
  // a "Filters" pill reveals it. Empty query → chips shown for browsing.
  const [showFilters, setShowFilters] = useState(false);
  const filtersVisible = !searchQuery.trim() || showFilters;
  const advancedCount =
    (searchDateFrom || searchDateTo ? 1 : 0) +
    (searchAmountMin || searchAmountMax ? 1 : 0) +
    (searchCategoryIds.length > 0 ? 1 : 0);

  return (
    <div className="px-[22px] pt-3">
      <div className="flex items-center gap-1">
        <BackButton onClick={() => goMobile("history")} />
        <div className="flex flex-1 items-center gap-2 rounded-2xl bg-card px-4 py-2.5">
          <span className="text-[15px]">🔍</span>
          <input
            value={searchQuery}
            onChange={(e) => set({ searchQuery: e.target.value })}
            placeholder={t("searchPlaceholder")}
            className="flex-1 bg-transparent text-[13.5px] font-semibold text-ink outline-none placeholder:text-subtle"
          />
        </div>
      </div>

      {filtersVisible ? (
        <div className="mt-4 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categoryChips.map((chip) => (
            <Chip
              key={chip.id}
              active={
                chip.id === "all"
                  ? searchCategoryIds.length === 0
                  : searchCategoryIds.includes(chip.id)
              }
              onClick={() => {
                if (chip.id === "all") set({ searchCategoryId: "all", searchCategoryIds: [] });
                else {
                  const next = searchCategoryIds.includes(chip.id)
                    ? searchCategoryIds.filter((id) => id !== chip.id)
                    : [...searchCategoryIds, chip.id];
                  set({
                    searchCategoryIds: next,
                    searchCategoryId: next.length === 1 ? next[0] : "all",
                  });
                }
              }}
            >
              {chip.label}
            </Chip>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowFilters(true)}
          className="mt-4 shrink-0 whitespace-nowrap rounded-full bg-card px-3.5 py-2 text-[12.5px] font-bold text-ink/70"
        >
          ⚙️ {t("filters")}
          {advancedCount > 0 ? ` · ${advancedCount}` : ""}
        </button>
      )}

      {showFilters && searchQuery.trim() && (
        <div className="mt-3 rounded-[12px] border border-edge bg-card p-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted">Date range</div>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <input
              type="date"
              value={searchDateFrom}
              onChange={(e) => set({ searchDateFrom: e.target.value })}
              aria-label="From"
              className="min-w-0 rounded-[8px] border border-edge bg-track px-2 py-2 text-[12px] text-ink outline-none focus:border-primary"
            />
            <input
              type="date"
              value={searchDateTo}
              onChange={(e) => set({ searchDateTo: e.target.value })}
              aria-label="To"
              className="min-w-0 rounded-[8px] border border-edge bg-track px-2 py-2 text-[12px] text-ink outline-none focus:border-primary"
            />
          </div>
          <div className="mt-3 text-[11px] font-bold uppercase tracking-wide text-muted">
            Amount range
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              inputMode="decimal"
              value={searchAmountMin}
              onChange={(e) => set({ searchAmountMin: e.target.value })}
              placeholder="Min"
              aria-label="Minimum amount"
              className="min-w-0 rounded-[8px] border border-edge bg-track px-2 py-2 text-[12px] text-ink outline-none focus:border-primary"
            />
            <input
              type="number"
              min="0"
              inputMode="decimal"
              value={searchAmountMax}
              onChange={(e) => set({ searchAmountMax: e.target.value })}
              placeholder="Max"
              aria-label="Maximum amount"
              className="min-w-0 rounded-[8px] border border-edge bg-track px-2 py-2 text-[12px] text-ink outline-none focus:border-primary"
            />
          </div>
          {advancedCount > 0 && (
            <button
              type="button"
              onClick={() =>
                set({
                  searchDateFrom: "",
                  searchDateTo: "",
                  searchAmountMin: "",
                  searchAmountMax: "",
                  searchCategoryIds: [],
                  searchCategoryId: "all",
                })
              }
              className="mt-3 w-full rounded-[8px] border border-edge py-2 text-[12px] font-semibold text-muted"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      <div className="mt-3 flex justify-end">
        <SavedViews mobile />
      </div>

      <div className="mt-[22px] flex items-center justify-between">
        <span className="text-[15px] font-extrabold text-ink">Results</span>
        <span className="text-xs font-bold text-muted">{summarizeResults(results)}</span>
      </div>

      {results.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2.5">
          {results.map((txn) => (
            <TransactionCard
              key={txn.id}
              txn={txn}
              showDateYear={searchingAllDates}
              onClick={() => openTransaction(txn.id)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-7 text-center text-muted">
          <div className="text-[34px]">🔍</div>
          <div className="mt-2 text-sm font-bold">No transactions match</div>
          <div className="mt-1 text-xs">Try a different word or filter</div>
        </div>
      )}
    </div>
  );
}

function amountBoundToCents(value: string): number | null {
  const amount = Number.parseFloat(value);
  if (!value.trim() || amount !== amount) return null;
  return Math.round(Math.abs(amount) * 100);
}
