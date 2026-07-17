"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Transaction } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "next-intl";

/** A compact category dropdown for a single transaction, used inline in the web
 *  Transactions table so a row can be categorized without opening the editor.
 *  Income has no category by design, so it renders a static label. */
export function InlineCategoryPicker({ txn }: { txn: Transaction }) {
  const t = useTranslations("addFlow");
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
        aria-label={t("category")}
        className={`max-w-full cursor-pointer truncate rounded-[8px] border py-1 pl-2.5 pr-[26px] text-[12px] font-semibold outline-none transition ${
          uncategorized
            ? "border-soft-border bg-primary-soft text-primary"
            : "border-edge/60 bg-transparent text-ink hover:border-edge hover:bg-track"
        } appearance-none disabled:opacity-50`}
      >
        <option value="">{uncategorized ? t("categorize") : t("uncategorized")}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.emoji} {c.name}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        strokeWidth={2.5}
        aria-hidden
        className={`pointer-events-none absolute right-1.5 ${
          uncategorized ? "text-primary" : "text-muted"
        }`}
      />
    </span>
  );
}
