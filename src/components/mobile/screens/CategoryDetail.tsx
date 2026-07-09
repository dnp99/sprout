"use client";

import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { AddCategoryForm } from "@/components/shared/AddCategoryForm";
import { ScreenHeader } from "@/components/ui/headers";
import { formatMoney, spentPercent } from "@/lib/format";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

export function CategoryDetail() {
  const { categories, transactions, selectedCategoryId, goMobile, openTransaction } = useStore(
    useShallow((s) => ({
      categories: s.categories,
      transactions: s.transactions,
      selectedCategoryId: s.selectedCategoryId,
      goMobile: s.goMobile,
      openTransaction: s.openTransaction,
    })),
  );
  const category = categories.find((c) => c.id === selectedCategoryId) ?? categories[0];
  const txns = transactions.filter((t) => t.categoryId === category.id);
  const percent = spentPercent(category.spentCents, category.monthlyBudgetCents);
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="px-4 pt-3">
        <ScreenHeader title="Edit category" onBack={() => setEditing(false)} />
        <div className="mt-4">
          {/* After a save or delete, return to the category grid. */}
          <AddCategoryForm category={category} onDone={() => goMobile("categories")} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-3">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => goMobile("categories")}
            aria-label="Back"
            className="flex-none text-muted"
          >
            <ChevronLeft size={18} strokeWidth={2} />
          </button>
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-[9px] bg-track text-[15px] leading-none">
            {category.emoji}
          </span>
          <span className="truncate text-[18px] font-bold tracking-[-.02em] text-ink">
            {category.name}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex-none rounded-[8px] border border-edge px-2.5 py-1.5 text-[11.5px] font-semibold text-ink"
        >
          Edit
        </button>
      </div>

      <div className="mt-3.5 rounded-[10px] bg-primary p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[30px] font-bold tracking-[-.02em] tabular-nums text-onprimary">
            {formatMoney(category.spentCents)}
          </span>
          <span className="text-[12px] font-medium text-onprimary/85">
            of {formatMoney(category.monthlyBudgetCents)}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-onprimary/25">
          <div className="h-full rounded-full bg-onprimary" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <h2 className="mt-4 text-[13.5px] font-semibold text-ink">Transactions</h2>
      <div className="mt-2.5 overflow-hidden rounded-[10px] border border-edge">
        {txns.map((txn, i) => (
          <button
            key={txn.id}
            type="button"
            onClick={() => openTransaction(txn.id)}
            className={`flex w-full items-center gap-3 px-3.5 py-3 text-left ${
              i > 0 ? "border-t border-edge" : ""
            }`}
          >
            <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] bg-track text-[15px] leading-none">
              {txn.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-semibold text-ink">{txn.merchant}</div>
              <div className="text-[10.5px] font-medium text-muted">{txn.dateLabel}</div>
            </div>
            <span
              className={`text-[12.5px] font-semibold tabular-nums ${
                txn.isIncome ? "text-green" : "text-ink"
              }`}
            >
              {formatMoney(txn.amountCents, { signed: true })}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
