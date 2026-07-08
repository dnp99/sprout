"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/controls";
import { TransactionCard } from "@/components/ui/rows";
import { filterTransactions, summarizeResults } from "@/lib/search";
import { useStore } from "@/state/store";

const CATEGORY_CHIPS = [
  { id: "all", label: "All" },
  { id: "groceries", label: "🛒 Groceries" },
  { id: "dining", label: "🍽️ Dining" },
  { id: "shopping", label: "🛍️ Shopping" },
  { id: "transport", label: "🚗 Transport" },
  { id: "bills", label: "🏠 Bills" },
  { id: "fun", label: "🎬 Fun" },
];

// Type filtering lives on the Transactions screen now; Search is text + category.
export function Search() {
  const { transactions, searchQuery, searchCategoryId, set, goMobile, openTransaction } =
    useStore();

  const results = filterTransactions(transactions, {
    query: searchQuery,
    categoryId: searchCategoryId,
  });

  // Collapse the category filter while actively typing so results get the room;
  // a "Filters" pill reveals it. Empty query → chips shown for browsing.
  const [showFilters, setShowFilters] = useState(false);
  const filtersVisible = !searchQuery.trim() || showFilters;
  const activeCat = CATEGORY_CHIPS.find((c) => c.id === searchCategoryId && c.id !== "all");

  return (
    <div className="px-[22px] pt-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => goMobile("history")}
          aria-label="Back"
          className="-mt-[3px] text-[28px] leading-none text-muted"
        >
          ‹
        </button>
        <div className="flex flex-1 items-center gap-2 rounded-2xl bg-card px-4 py-2.5">
          <span className="text-[15px]">🔍</span>
          <input
            value={searchQuery}
            onChange={(e) => set({ searchQuery: e.target.value })}
            placeholder="Search anything…"
            className="flex-1 bg-transparent text-[13.5px] font-semibold text-ink outline-none placeholder:text-subtle"
          />
        </div>
      </div>

      {filtersVisible ? (
        <div className="mt-4 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORY_CHIPS.map((chip) => (
            <Chip
              key={chip.id}
              active={searchCategoryId === chip.id}
              onClick={() => set({ searchCategoryId: chip.id })}
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
          ⚙️ Filters{activeCat ? ` · ${activeCat.label}` : ""}
        </button>
      )}

      <div className="mt-[22px] flex items-center justify-between">
        <span className="text-[15px] font-extrabold text-ink">Results</span>
        <span className="text-xs font-bold text-muted">{summarizeResults(results)}</span>
      </div>

      {results.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2.5">
          {results.map((txn) => (
            <TransactionCard key={txn.id} txn={txn} onClick={() => openTransaction(txn.id)} />
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
