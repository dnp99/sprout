"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Transaction } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "next-intl";

/** A compact category or income-source dropdown for a single transaction, used
 *  inline in the web Transactions table so the row remains editable without
 *  opening the full editor. */
export function InlineCategoryPicker({ txn }: { txn: Transaction }) {
  const t = useTranslations("addFlow");
  const tTxns = useTranslations("txns");
  const { categories, incomeSources, setTransactionCategory, updateTransaction } = useStore(
    useShallow((s) => ({
      categories: s.categories,
      incomeSources: s.incomeSources,
      setTransactionCategory: s.setTransactionCategory,
      updateTransaction: s.updateTransaction,
    })),
  );
  const [busy, setBusy] = useState(false);

  if (txn.isIncome) {
    return (
      <InlineSelect
        value={txn.incomeSourceId ?? ""}
        disabled={busy}
        ariaLabel={t("incomeSource")}
        onChange={async (value) => {
          setBusy(true);
          try {
            await updateTransaction(txn.id, {
              merchant: txn.merchant,
              amountCents: txn.amountCents,
              categoryId: txn.categoryId,
              incomeSourceId: value || null,
              note: txn.note ?? null,
              excludeFromBudget: Boolean(txn.excludeFromBudget),
            });
          } finally {
            setBusy(false);
          }
        }}
      >
        <option value="">{tTxns("unassignedIncome")}</option>
        {incomeSources.map((source) => (
          <option key={source.id} value={source.id}>
            {source.emoji} {source.name}
          </option>
        ))}
      </InlineSelect>
    );
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
    <InlineSelect
      value={txn.categoryId ?? ""}
      disabled={busy}
      ariaLabel={t("category")}
      uncategorized={uncategorized}
      onChange={change}
    >
      <option value="">{uncategorized ? t("categorize") : t("uncategorized")}</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.emoji} {c.name}
        </option>
      ))}
    </InlineSelect>
  );
}

function InlineSelect({
  value,
  disabled,
  ariaLabel,
  uncategorized = false,
  onChange,
  children,
}: {
  value: string;
  disabled: boolean;
  ariaLabel: string;
  uncategorized?: boolean;
  onChange: (value: string) => void | Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <span
      // Stop the row's click-to-edit from firing when interacting with the select.
      onClick={(e) => e.stopPropagation()}
      className="relative inline-flex max-w-full items-center"
    >
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => void onChange(event.target.value)}
        aria-label={ariaLabel}
        className={`max-w-full cursor-pointer truncate rounded-[8px] border py-1 pl-2.5 pr-[26px] text-[12px] font-semibold outline-none transition ${
          uncategorized
            ? "border-soft-border bg-primary-soft text-primary"
            : "border-edge bg-transparent text-ink hover:border-soft-border hover:bg-track focus:border-primary"
        } appearance-none disabled:opacity-50`}
      >
        {children}
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
