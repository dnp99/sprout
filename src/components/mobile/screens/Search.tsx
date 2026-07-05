"use client";

import { Chip } from "@/components/ui/controls";
import { TransactionCard } from "@/components/ui/rows";
import { filterTransactions, summarizeResults } from "@/lib/search";
import type { TxnFilter } from "@/lib/types";
import { useStore } from "@/state/store";

const TYPE_CHIPS: { value: TxnFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "expense", label: "💸 Expenses" },
  { value: "income", label: "💰 Income" },
  { value: "uncategorized", label: "🏷️ Uncategorized" },
];

const CATEGORY_CHIPS = [
  { id: "all", label: "All" },
  { id: "groceries", label: "🛒 Groceries" },
  { id: "dining", label: "🍽️ Dining" },
  { id: "shopping", label: "🛍️ Shopping" },
  { id: "transport", label: "🚗 Transport" },
  { id: "bills", label: "🏠 Bills" },
  { id: "fun", label: "🎬 Fun" },
];

export function Search() {
  const {
    transactions,
    searchQuery,
    searchType,
    searchCategoryId,
    set,
    goMobile,
    openTransaction,
  } = useStore();

  const results = filterTransactions(transactions, {
    query: searchQuery,
    type: searchType,
    categoryId: searchCategoryId,
  });
  const uncategorizedCount = filterTransactions(transactions, { type: "uncategorized" }).length;

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

      <div className="mt-4 flex flex-wrap gap-2">
        {TYPE_CHIPS.map((chip) => (
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
      <div className="mt-2.5 flex flex-wrap gap-2">
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
