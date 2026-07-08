"use client";

import { useState } from "react";
import type { Transaction } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

/** A compact category dropdown for a single transaction, used inline in the web
 *  Transactions table so a row can be categorized without opening the editor.
 *  Income has no category by design, so it renders a static label. */
export function InlineCategoryPicker({ txn }: { txn: Transaction }) {
  const { categories, setTransactionCategory } = useStore(
    useShallow((s) => ({
      categories: s.categories,
      setTransactionCategory: s.setTransactionCategory,
    })),
  );
  const [busy, setBusy] = useState(false);

  if (txn.isIncome) {
    return <span className="font-semibold text-muted">{txn.categoryName}</span>;
  }

  async function change(value: string) {
    setBusy(true);
    try {
      await setTransactionCategory(txn.id, value || null);
    } finally {
      setBusy(false);
    }
  }

  const uncategorized = txn.categoryId === null;
  return (
    <span
      // Stop the row's click-to-edit from firing when interacting with the select.
      onClick={(e) => e.stopPropagation()}
      className="relative inline-flex max-w-full items-center"
    >
      <select
        value={txn.categoryId ?? ""}
        disabled={busy}
        onChange={(e) => change(e.target.value)}
        aria-label="Category"
        className={`max-w-full cursor-pointer truncate rounded-md border py-1 pl-2 pr-6 text-[12.5px] font-semibold outline-none transition ${
          uncategorized
            ? "border-dashed border-primary/50 bg-peach-soft/40 text-primary-dark"
            : "border-transparent bg-transparent text-muted hover:border-track hover:bg-card"
        } appearance-none disabled:opacity-50`}
      >
        <option value="">{uncategorized ? "🏷️ Categorize…" : "Uncategorized"}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.emoji} {c.name}
          </option>
        ))}
      </select>
      <span
        className={`pointer-events-none absolute right-1.5 text-[10px] ${
          uncategorized ? "text-primary-dark" : "text-subtle"
        }`}
      >
        ▾
      </span>
    </span>
  );
}
