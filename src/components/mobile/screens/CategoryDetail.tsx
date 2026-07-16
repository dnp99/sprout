"use client";

import { useState } from "react";
import { AddCategoryForm } from "@/components/shared/AddCategoryForm";
import { CategoryDetailPanel } from "@/components/shared/CategoryDetailPanel";
import { ScreenHeader } from "@/components/ui/headers";
import { filterTransactions, sortTransactions } from "@/lib/search";
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
  const txns = category
    ? sortTransactions(
        filterTransactions(transactions, { categoryId: category.id }),
        "date",
        "desc",
      )
    : [];
  const [editing, setEditing] = useState(false);

  if (!category) return null;

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
    <CategoryDetailPanel
      category={category}
      spentCents={category.spentCents}
      budgetCents={category.monthlyBudgetCents}
      transactions={txns}
      onBack={() => goMobile("categories")}
      onEdit={() => setEditing(true)}
      onOpenTransaction={openTransaction}
      className="px-4 pt-3"
    />
  );
}
