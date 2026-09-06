"use client";

import {
  ArrowLeftRight,
  ArrowUpDown,
  ChevronDown,
  CircleMinus,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { CategorizeBacklogButton } from "@/components/shared/CategorizeBacklogButton";
import { ReimbursementInfo } from "@/components/shared/ReimbursementInfo";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { StatCard } from "@/components/ui/StatCard";
import { TransactionCard } from "@/components/ui/rows";
import { formatMoney } from "@/lib/format";
import {
  ALL_MONTHS_FILTERS,
  TXN_SORTS,
  TXN_TYPE_CHIPS,
  type TxnSort,
  filterTransactions,
  sortTransactions,
} from "@/lib/search";
import { monthTotals, resolveViewMonth } from "@/lib/trends";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "next-intl";

export function Activity() {
  const t = useTranslations("txns");
  const { showToast } = useToast();
  const {
    transactions,
    categories,
    incomeSources,
    viewMonthKey,
    searchType,
    txnCategory,
    set,
    goMobile,
    openTransaction,
    bulkCategorize,
    bulkDelete,
    bulkSetIncomeSource,
    bulkExclude,
  } = useStore(
    useShallow((s) => ({
      transactions: s.transactions,
      categories: s.categories,
      incomeSources: s.incomeSources,
      viewMonthKey: s.viewMonthKey,
      searchType: s.searchType,
      txnCategory: s.txnCategory,
      set: s.set,
      goMobile: s.goMobile,
      openTransaction: s.openTransaction,
      bulkCategorize: s.bulkCategorize,
      bulkDelete: s.bulkDelete,
      bulkSetIncomeSource: s.bulkSetIncomeSource,
      bulkExclude: s.bulkExclude,
    })),
  );

  const [sort, setSort] = useState<TxnSort>("newest");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [applyingCategory, setApplyingCategory] = useState(false);
  const [bulkIncomeSourceId, setBulkIncomeSourceId] = useState("");
  const [applyingSource, setApplyingSource] = useState(false);
  const [excluding, setExcluding] = useState(false);

  const monthKey = resolveViewMonth(viewMonthKey, transactions);
  // Uncategorized/Excluded are a whole-backlog review, so they ignore the month.
  const allMonths = ALL_MONTHS_FILTERS.has(searchType);
  const filtered = filterTransactions(transactions, {
    type: searchType,
    categoryId: txnCategory === "all" ? null : txnCategory,
    monthKey: allMonths ? undefined : monthKey,
  });
  const sortMeta = TXN_SORTS.find((s) => s.value === sort) ?? TXN_SORTS[0];
  const rows = sortTransactions(filtered, sortMeta.key, sortMeta.dir);
  const uncategorizedCount = filterTransactions(transactions, { type: "uncategorized" }).length;
  const { spentCents, incomeCents } = monthTotals(transactions, monthKey);
  const selectedIncomeCount = rows.filter(
    (transaction) => selected.has(transaction.id) && transaction.isIncome,
  ).length;
  const selectedExpenseIds = rows
    .filter((transaction) => selected.has(transaction.id) && !transaction.isIncome)
    .map((transaction) => transaction.id);
  const selectedExpenseCount = selectedExpenseIds.length;

  const allSelected = rows.length > 0 && rows.every((t) => selected.has(t.id));
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((t) => t.id)));
  const exitSelect = () => {
    setSelectMode(false);
    setSelected(new Set());
    setConfirmDelete(false);
  };
  async function deleteSelected() {
    setDeleting(true);
    try {
      const count = await bulkDelete([...selected]);
      exitSelect();
      showToast(t("bulkDeleted", { count }));
    } catch {
      showToast(t("bulkUpdateFailed"), "error");
    } finally {
      setDeleting(false);
    }
  }
  async function applyIncomeSource() {
    setApplyingSource(true);
    try {
      const count = await bulkSetIncomeSource([...selected], bulkIncomeSourceId || null);
      exitSelect();
      setBulkIncomeSourceId("");
      const source = bulkIncomeSourceId
        ? (incomeSources.find((item) => item.id === bulkIncomeSourceId)?.name ??
          t("unassignedIncome"))
        : t("unassignedIncome");
      showToast(t("bulkSourceChanged", { count, source }));
    } catch {
      showToast(t("bulkUpdateFailed"), "error");
    } finally {
      setApplyingSource(false);
    }
  }

  async function applyCategory() {
    if (!bulkCategoryId) return;
    setApplyingCategory(true);
    try {
      const count = await bulkCategorize(selectedExpenseIds, bulkCategoryId);
      exitSelect();
      const category =
        categories.find((item) => item.id === bulkCategoryId)?.name ?? t("uncategorized");
      setBulkCategoryId("");
      showToast(t("bulkCategoryChanged", { count, category }));
    } catch {
      showToast(t("bulkUpdateFailed"), "error");
    } finally {
      setApplyingCategory(false);
    }
  }

  async function excludeSelected() {
    setExcluding(true);
    try {
      const count = await bulkExclude([...selected]);
      exitSelect();
      showToast(t("bulkExcluded", { count }));
    } catch {
      showToast(t("bulkUpdateFailed"), "error");
    } finally {
      setExcluding(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col px-4 pb-28 pt-1.5">
      {/* Full-width search — tapping it opens its own screen. */}
      <button
        type="button"
        onClick={() => goMobile("search")}
        className="flex h-11 w-full items-center gap-[7px] rounded-[10px] border border-edge px-3 text-left"
      >
        <Search size={14} strokeWidth={2} className="flex-none text-muted" />
        <span className="text-[12px] font-medium text-muted">Search</span>
      </button>

      {/* Wrapping keeps every filter visible and tappable instead of leaving the
       * final option looking accidentally clipped at narrow phone widths. */}
      <div className="mt-2.5 flex flex-wrap gap-2">
        {TXN_TYPE_CHIPS.map((chip) => {
          const active = searchType === chip.value;
          const count =
            chip.value === "uncategorized" && uncategorizedCount > 0
              ? ` ${uncategorizedCount}`
              : "";
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => set({ searchType: chip.value })}
              className={`min-h-11 whitespace-nowrap rounded-[10px] border px-3 py-2 text-[12px] transition ${
                active
                  ? "border-primary bg-primary font-semibold text-onprimary"
                  : "border-edge font-medium text-muted"
              }`}
            >
              {t(chip.labelKey)}
              {count}
            </button>
          );
        })}
      </div>

      {searchType === "reimbursement" && <ReimbursementInfo compact className="mt-2.5" />}

      {/* Category filter + sort share a row. */}
      <div className="mt-2.5 flex items-center gap-2">
        <div className="relative flex-1">
          <select
            value={txnCategory}
            onChange={(e) => set({ txnCategory: e.target.value })}
            aria-label="Filter by category"
            className={`h-11 w-full appearance-none rounded-[10px] border px-3 pr-9 text-[12px] font-medium outline-none ${
              txnCategory === "all"
                ? "border-edge bg-card text-ink"
                : "border-primary bg-primary-soft text-primary-dark"
            }`}
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            strokeWidth={2}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          />
        </div>
        <div className="relative flex-none">
          <ArrowUpDown
            size={13}
            strokeWidth={2}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as TxnSort)}
            aria-label="Sort transactions"
            className="h-11 appearance-none rounded-[10px] border border-edge bg-card pl-[30px] pr-3 text-[12px] font-semibold text-ink outline-none"
          >
            {TXN_SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {searchType === "uncategorized" && <CategorizeBacklogButton className="mt-3" />}

      {/* Spent/Income summary applies only to month-scoped filters. */}
      {!allMonths && (
        <div className="mt-3 flex gap-2.5">
          <StatCard label="Spent" value={formatMoney(spentCents)} className="flex-1" />
          <StatCard
            label="Income"
            value={formatMoney(incomeCents)}
            variant="income"
            className="flex-1"
          />
        </div>
      )}

      {/* Multi-select actions stack by purpose on mobile so labels stay legible
       * and every control retains a full-size touch target. */}
      {rows.length > 0 &&
        (selectMode ? (
          <div className="mt-3 rounded-[10px] border border-edge bg-track p-3">
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 text-[13px] font-semibold text-ink">
                {t("selectedN", { count: selected.size })}
              </span>
              <button
                type="button"
                onClick={toggleAll}
                className="min-h-11 rounded-[8px] px-3 text-[12px] font-semibold text-primary"
              >
                {allSelected ? t("selectNone") : t("selectAll")}
              </button>
              <button
                type="button"
                onClick={exitSelect}
                className="min-h-11 rounded-[8px] px-3 text-[12px] font-semibold text-muted"
              >
                {t("done")}
              </button>
            </div>

            {selectedExpenseCount > 0 && (
              <div className="mt-2 border-t border-edge pt-3">
                <div className="mb-2 text-[11px] font-semibold text-muted">
                  {t("expenseSelectedN", { count: selectedExpenseCount })}
                </div>
                <div className="flex gap-2">
                  <select
                    value={bulkCategoryId}
                    onChange={(event) => setBulkCategoryId(event.target.value)}
                    aria-label={t("applyCategory")}
                    className="h-11 min-w-0 flex-1 rounded-[8px] border border-edge bg-card px-3 text-[12px] font-medium text-ink outline-none"
                  >
                    <option value="" disabled>
                      {t("selectCategory")}
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.emoji} {category.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void applyCategory()}
                    disabled={applyingCategory || !bulkCategoryId}
                    className="h-11 rounded-[8px] bg-primary px-4 text-[12px] font-semibold text-onprimary disabled:opacity-50"
                  >
                    {applyingCategory ? t("applying") : t("apply")}
                  </button>
                </div>
              </div>
            )}

            {selectedIncomeCount > 0 && (
              <div className="mt-2 border-t border-edge pt-3">
                <div className="mb-2 text-[11px] font-semibold text-muted">
                  {t("incomeSelectedN", { count: selectedIncomeCount })}
                </div>
                <div className="flex gap-2">
                  <select
                    value={bulkIncomeSourceId}
                    onChange={(event) => setBulkIncomeSourceId(event.target.value)}
                    aria-label={t("setIncomeSource")}
                    className="h-11 min-w-0 flex-1 rounded-[8px] border border-edge bg-card px-3 text-[12px] font-medium text-ink outline-none"
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
                    disabled={applyingSource || selected.size === 0}
                    className="h-11 rounded-[8px] bg-primary px-4 text-[12px] font-semibold text-onprimary disabled:opacity-50"
                  >
                    {applyingSource ? t("applying") : t("apply")}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-edge pt-3">
              <button
                type="button"
                onClick={() => void excludeSelected()}
                disabled={excluding || selected.size === 0}
                className="flex h-11 items-center justify-center gap-1.5 rounded-[8px] border border-edge bg-card px-3 text-[12px] font-semibold text-muted disabled:opacity-40"
              >
                <CircleMinus size={14} strokeWidth={2.2} />
                {excluding ? t("excluding") : t("exclude")}
              </button>
              <button
                type="button"
                onClick={() => selected.size > 0 && setConfirmDelete(true)}
                disabled={selected.size === 0}
                className="flex h-11 items-center justify-center gap-1.5 rounded-[8px] border border-edge bg-card px-3 text-[12px] font-semibold text-primary disabled:opacity-40"
              >
                <Trash2 size={14} strokeWidth={2.2} /> {t("delete")}
              </button>
            </div>
            {confirmDelete && (
              <ConfirmDialog
                title={t("deleteN", { count: selected.size })}
                message={t("bulkDeleteConfirm")}
                confirmLabel={t("delete")}
                cancelLabel={t("cancel")}
                busy={deleting}
                onCancel={() => setConfirmDelete(false)}
                onConfirm={() => void deleteSelected()}
              />
            )}
          </div>
        ) : (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => setSelectMode(true)}
              className="text-[12px] font-semibold text-primary"
            >
              Select
            </button>
          </div>
        ))}

      {rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-track">
            <ArrowLeftRight size={26} strokeWidth={1.8} className="text-muted" />
          </span>
          <div className="mt-4 text-[15px] font-semibold text-ink">
            No transactions{allMonths ? " yet" : " this month"}
          </div>
          <div className="mt-1 text-[12px] font-medium leading-relaxed text-muted">
            Add your first transaction and it&rsquo;ll show up here.
          </div>
        </div>
      ) : (
        <div className="mt-2.5 flex flex-col gap-2.5">
          {rows.map((txn) => (
            <TransactionCard
              key={txn.id}
              txn={txn}
              selectable={selectMode}
              selected={selected.has(txn.id)}
              onToggle={() => toggleOne(txn.id)}
              onClick={() => openTransaction(txn.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
