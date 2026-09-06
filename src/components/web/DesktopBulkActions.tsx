"use client";

import { CircleMinus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Category, IncomeSource, Transaction } from "@/lib/types";

interface DesktopBulkActionsProps {
  selectedTransactions: Transaction[];
  categories: Category[];
  incomeSources: IncomeSource[];
  onCategorize: (ids: string[], categoryId: string | null) => Promise<number>;
  onSetIncomeSource: (ids: string[], incomeSourceId: string | null) => Promise<number>;
  onExclude: (ids: string[]) => Promise<number>;
  onDelete: (ids: string[]) => Promise<number>;
  onClear: () => void;
}

/** Desktop bulk-edit panel. Each field/button pair stays in an atomic group so
 *  responsive wrapping never separates an Apply action from its target. */
export function DesktopBulkActions({
  selectedTransactions,
  categories,
  incomeSources,
  onCategorize,
  onSetIncomeSource,
  onExclude,
  onDelete,
  onClear,
}: DesktopBulkActionsProps) {
  const t = useTranslations("txns");
  const [categoryId, setCategoryId] = useState("");
  const [incomeSourceId, setIncomeSourceId] = useState("");
  const [applyingCategory, setApplyingCategory] = useState(false);
  const [applyingIncomeSource, setApplyingIncomeSource] = useState(false);
  const [excluding, setExcluding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const selectedIds = selectedTransactions.map((transaction) => transaction.id);
  const expenseIds = selectedTransactions
    .filter((transaction) => !transaction.isIncome)
    .map((transaction) => transaction.id);
  const incomeIds = selectedTransactions
    .filter((transaction) => transaction.isIncome)
    .map((transaction) => transaction.id);

  async function applyCategory() {
    setApplyingCategory(true);
    try {
      // Income rows never receive expense categories, even in a mixed selection.
      await onCategorize(expenseIds, categoryId || null);
      onClear();
    } finally {
      setApplyingCategory(false);
    }
  }

  async function applyIncomeSource() {
    setApplyingIncomeSource(true);
    try {
      await onSetIncomeSource(incomeIds, incomeSourceId || null);
      onClear();
    } finally {
      setApplyingIncomeSource(false);
    }
  }

  async function excludeSelected() {
    setExcluding(true);
    try {
      await onExclude(selectedIds);
      onClear();
    } finally {
      setExcluding(false);
    }
  }

  async function deleteSelected() {
    setDeleting(true);
    try {
      await onDelete(selectedIds);
      onClear();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section
      aria-label={t("bulkActions")}
      className="flex flex-wrap items-center gap-2 rounded-[10px] border border-edge bg-card p-2"
    >
      <span className="px-2 text-[13px] font-semibold text-ink">
        {t("selectedN", { count: selectedTransactions.length })}
      </span>

      {expenseIds.length > 0 && (
        <div className="flex min-w-0 items-center gap-2 border-l border-edge pl-2">
          <label htmlFor="bulk-category" className="sr-only">
            {t("expenseSelectedN", { count: expenseIds.length })}
          </label>
          <select
            id="bulk-category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="h-9 min-w-0 max-w-[200px] rounded-[8px] border border-edge bg-card px-3 text-[12.5px] font-medium text-ink outline-none"
          >
            <option value="">{t("uncategorized")}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.emoji} {category.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void applyCategory()}
            disabled={applyingCategory}
            className="h-9 whitespace-nowrap rounded-[8px] bg-primary px-3 text-[12.5px] font-semibold text-onprimary disabled:opacity-50"
          >
            {applyingCategory ? t("applying") : t("applyCategory")}
          </button>
        </div>
      )}

      {incomeIds.length > 0 && (
        <div className="flex min-w-0 items-center gap-2 border-l border-edge pl-2">
          <label htmlFor="bulk-income-source" className="sr-only">
            {t("incomeSelectedN", { count: incomeIds.length })}
          </label>
          <select
            id="bulk-income-source"
            value={incomeSourceId}
            onChange={(event) => setIncomeSourceId(event.target.value)}
            className="h-9 min-w-0 max-w-[200px] rounded-[8px] border border-edge bg-card px-3 text-[12.5px] font-medium text-ink outline-none"
          >
            <option value="">{t("unassignedIncome")}</option>
            {incomeSources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.emoji} {source.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void applyIncomeSource()}
            disabled={applyingIncomeSource}
            className="h-9 whitespace-nowrap rounded-[8px] bg-primary px-3 text-[12.5px] font-semibold text-onprimary disabled:opacity-50"
          >
            {applyingIncomeSource ? t("applying") : t("applyIncomeSource")}
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 border-l border-edge pl-2">
        <button
          type="button"
          onClick={() => void excludeSelected()}
          disabled={excluding}
          className="flex h-9 items-center gap-1.5 rounded-[8px] border border-edge px-3 text-[12.5px] font-semibold text-muted transition hover:bg-track hover:text-ink disabled:opacity-50"
        >
          <CircleMinus size={14} strokeWidth={2} />
          {excluding ? t("excluding") : t("excludeSelected")}
        </button>

        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => void deleteSelected()}
              disabled={deleting}
              className="flex h-9 items-center gap-1.5 rounded-[8px] bg-primary px-3 text-[12.5px] font-semibold text-onprimary disabled:opacity-50"
            >
              <Trash2 size={14} strokeWidth={2} />
              {deleting ? t("deleting") : t("deleteN", { count: selectedTransactions.length })}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="h-9 rounded-[8px] px-2 text-[12.5px] font-medium text-muted hover:bg-track hover:text-ink"
            >
              {t("cancel")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex h-9 items-center gap-1.5 rounded-[8px] border border-edge px-3 text-[12.5px] font-semibold text-primary transition hover:border-soft-border hover:bg-primary-soft"
          >
            <Trash2 size={14} strokeWidth={2} /> {t("delete")}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onClear}
        className="ml-auto h-9 rounded-[8px] px-3 text-[12.5px] font-medium text-muted hover:bg-track hover:text-ink"
      >
        {t("clearSelection")}
      </button>
    </section>
  );
}
