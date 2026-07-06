"use client";

import { useState } from "react";
import { AddCategoryForm } from "@/components/shared/AddCategoryForm";
import { ScreenHeader } from "@/components/ui/headers";
import { TransactionCard } from "@/components/ui/rows";
import { formatMoney, spentPercent } from "@/lib/format";
import { useStore } from "@/state/store";

export function CategoryDetail() {
  const { categories, transactions, selectedCategoryId, goMobile, openTransaction } = useStore();
  const category = categories.find((c) => c.id === selectedCategoryId) ?? categories[0];
  const txns = transactions.filter((t) => t.categoryId === category.id);
  const percent = spentPercent(category.spentCents, category.monthlyBudgetCents);
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="px-[22px] pt-3">
        <ScreenHeader title="Edit category ✍️" onBack={() => setEditing(false)} />
        <div className="mt-4">
          {/* After a save or delete, return to the category grid. */}
          <AddCategoryForm category={category} onDone={() => goMobile("categories")} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-[22px] pt-3">
      <ScreenHeader
        title={
          <span className="flex items-center gap-2">
            <span className="text-2xl">{category.emoji}</span>
            {category.name}
          </span>
        }
        onBack={() => goMobile("categories")}
        right={
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[13px] font-extrabold text-primary"
          >
            Edit
          </button>
        }
      />

      <div className="mt-4 rounded-card bg-primary p-5 text-white">
        <div className="flex items-baseline justify-between">
          <span className="text-[34px] font-extrabold tracking-tight tabular-nums">
            {formatMoney(category.spentCents)}
          </span>
          <span className="text-[12.5px] font-semibold opacity-85">
            of {formatMoney(category.monthlyBudgetCents)}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/30">
          <div className="h-full rounded-full bg-white" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <h2 className="mt-5 text-[15px] font-extrabold text-ink">Transactions</h2>
      <div className="mt-2.5 flex flex-col gap-2.5">
        {txns.map((txn) => (
          <TransactionCard key={txn.id} txn={txn} onClick={() => openTransaction(txn.id)} />
        ))}
      </div>
    </div>
  );
}
