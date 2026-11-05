"use client";
import {
  MobileTransactionTotals,
  MobileTransactionCount,
} from "@/components/shared/MobileTransactionSummary";
import { hiddenSelectionCount } from "@/lib/transactions/selection";
import { MobileSelectionBar } from "@/components/shared/MobileSelectionBar";
import { categoryLabel } from "@/lib/categories/labels";
import { BusinessActivitySummary } from "@/components/shared/BusinessActivity";
import { useBusinessLedger } from "@/hooks/useBusinessLedger";
import { useScopedSelection } from "@/hooks/useScopedSelection";
import { resolveViewMonth } from "@/lib/trends";
import { ActivityFilters } from "../ActivityFilters";
import { IconAction } from "@/components/ui/IconAction";
import { TransactionScopeSwitch } from "@/components/shared/TransactionScopeSwitch";
import { filterScopedTransactions, ledgerMonthScope } from "@/lib/transactions/scoped-filter";
import { requiresDeleteConfirmation } from "@/lib/deletion";

import { amountBoundToCents } from "@/components/web/TransactionFilters";

import { Select } from "@/components/ui/Select";

import { ArrowLeftRight, CircleMinus, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { MobileRecordList } from "../MobileRecordList";
import { CategorizeBacklogButton } from "@/components/shared/CategorizeBacklogButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { TransactionRowActions } from "@/components/web/TransactionRowActions";
import { TransactionCard } from "@/components/ui/rows";
import { formatMoney } from "@/lib/format";
import { TXN_SORTS, type TxnSort, sortTransactions } from "@/lib/search";
import { monthTotals } from "@/lib/trends";
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
    searchType,
    mobileTxnScope,
    txnCategory,
    set,
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
      searchType: s.searchType,
      mobileTxnScope: s.mobileTxnScope,
      txnCategory: s.txnCategory,
      set: s.set,
      openTransaction: s.openTransaction,
      bulkCategorize: s.bulkCategorize,
      bulkDelete: s.bulkDelete,
      bulkSetIncomeSource: s.bulkSetIncomeSource,
      bulkExclude: s.bulkExclude,
    })),
  );

  const sourceRows = useBusinessLedger();
  const businessId = useStore((s) => s.txnBusinessId);
  const period = useStore((s) => s.txnBusinessPeriod);
  const month = useStore((s) => s.viewMonthKey);
  const [incomeSourceFilter, setIncomeSourceFilter] = useState("all");
  const [sort, setSort] = useState<TxnSort>("newest");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useScopedSelection(businessId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [applyingCategory, setApplyingCategory] = useState(false);
  const [bulkIncomeSourceId, setBulkIncomeSourceId] = useState("");
  const [applyingSource, setApplyingSource] = useState(false);
  const [excluding, setExcluding] = useState(false);

  const search = useStore(
    useShallow((s) => ({
      query: s.searchQuery,
      allDates: s.mobileTxnAllDates,
      from: s.webDateFrom,
      to: s.webDateTo,
      categoryIds: s.searchCategoryIds,
      min: s.searchAmountMin,
      max: s.searchAmountMax,
    })),
  );
  const filtered = useMemo(
    () =>
      filterScopedTransactions(sourceRows, mobileTxnScope, {
        businessId,
        monthKey: ledgerMonthScope(
          resolveViewMonth(month, transactions),
          businessId,
          period,
          search.allDates || !!search.from || !!search.to,
        ),
        type: searchType,
        categoryId: txnCategory === "all" ? null : txnCategory,
        query: search.query,
        categoryIds: search.categoryIds.length ? search.categoryIds : undefined,
        incomeSourceId:
          mobileTxnScope === "income" && incomeSourceFilter !== "all"
            ? incomeSourceFilter
            : undefined,
        dateFrom: search.from || undefined,
        dateTo: search.to || undefined,
        amountMin: amountBoundToCents(search.min),
        amountMax: amountBoundToCents(search.max),
      }),
    [
      sourceRows,
      mobileTxnScope,
      businessId,
      month,
      transactions,
      period,
      searchType,
      txnCategory,
      search,
      incomeSourceFilter,
    ],
  );
  const sortMeta = TXN_SORTS.find((s) => s.value === sort) ?? TXN_SORTS[0];
  const rows = useMemo(
    () => sortTransactions(filtered, sortMeta.key, sortMeta.dir),
    [filtered, sortMeta],
  );
  const userId = useStore((s) => s.user.id);
  const listScope = `${userId}:${businessId}:${month}:${sort}:${rows.length}:${rows[0]?.id ?? ""}:${rows[rows.length - 1]?.id ?? ""}`;
  const selectedMonth = resolveViewMonth(month, transactions);
  const monthlyCount = sourceRows.filter(
    (row) => row.occurredAt.slice(0, 7) === selectedMonth,
  ).length;
  const uncategorizedCount = filterScopedTransactions(sourceRows, mobileTxnScope, {
    businessId,
    monthKey: ledgerMonthScope(
      resolveViewMonth(month, transactions),
      businessId,
      period,
      search.allDates || !!search.from || !!search.to,
    ),
    type: "uncategorized",
    query: search.query,
    dateFrom: search.from || undefined,
    dateTo: search.to || undefined,
  }).length;
  const { spentCents, incomeCents } = monthTotals(filtered);
  const selectedIncomeCount = sourceRows.filter(
    (transaction) => selected.has(transaction.id) && transaction.isIncome,
  ).length;
  const selectedExpenseIds = sourceRows
    .filter((transaction) => selected.has(transaction.id) && !transaction.isIncome)
    .map((transaction) => transaction.id);
  const selectedExpenseCount = selectedExpenseIds.length;

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
    <div data-workspace="transactions" className="flex min-h-full flex-col px-4 pb-28 pt-1.5">
      <TransactionScopeSwitch
        value={mobileTxnScope}
        onChange={(scope) => {
          setIncomeSourceFilter("all");
          set({
            mobileTxnScope: scope,
            searchType: "all",
            txnCategory: "all",
            searchCategoryId: "all",
            searchCategoryIds: [],
          });
        }}
      />
      <div className="mb-2 flex flex-col gap-2">
        <div className="flex w-full items-start gap-2">
          <ActivityFilters
            mobileTxnScope={mobileTxnScope}
            uncategorizedCount={uncategorizedCount}
            incomeSourceFilter={incomeSourceFilter}
            onIncomeSourceChange={setIncomeSourceFilter}
            sort={sort}
            onSort={setSort}
          />
        </div>
      </div>
      {businessId === "all" && searchType === "uncategorized" && (
        <CategorizeBacklogButton className="mt-3" />
      )}

      <div className="mobile-transaction-summary">
        {businessId === "all" && (
          <MobileTransactionTotals spentCents={spentCents} incomeCents={incomeCents} />
        )}

        <BusinessActivitySummary rows={filtered} />
      </div>
      <MobileSelectionBar
        summary={<MobileTransactionCount count={rows.length} total={monthlyCount} />}
        actions={
          selected.size > 0 ? (
            <div className="space-y-2">
              {selectedExpenseCount > 0 && (
                <div className="mt-2 border-t border-edge pt-3">
                  <div className="mb-2 text-[11px] font-semibold text-muted">
                    {t("expenseSelectedN", { count: selectedExpenseCount })}
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={bulkCategoryId}
                      onChange={(event) => setBulkCategoryId(event.target.value)}
                      aria-label={t("applyCategory")}
                      className="h-11 min-w-0 flex-1 rounded-[8px] border border-edge bg-card px-3 text-[12px] font-medium text-ink outline-none"
                    >
                      <option value="" disabled>
                        {t("selectCategory")}
                      </option>
                      {categories.map((category) => (
                        <option data-icon={category.emoji} key={category.id} value={category.id}>
                          {categoryLabel(categories, category)}
                        </option>
                      ))}
                    </Select>
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
                    <Select
                      value={bulkIncomeSourceId}
                      onChange={(event) => setBulkIncomeSourceId(event.target.value)}
                      aria-label={t("setIncomeSource")}
                      className="h-11 min-w-0 flex-1 rounded-[8px] border border-edge bg-card px-3 text-[12px] font-medium text-ink outline-none"
                    >
                      <option value="">{t("unassignedIncome")}</option>
                      {incomeSources.map((source) => (
                        <option data-icon={source.emoji} key={source.id} value={source.id}>
                          {source.name}
                        </option>
                      ))}
                    </Select>
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
                <IconAction
                  action="delete"
                  className="rounded-[8px] border border-edge bg-card text-primary hover:bg-track"
                  label={t("delete")}
                  type="button"
                  onClick={() => {
                    if (requiresDeleteConfirmation(selected.size)) setConfirmDelete(true);
                    else if (selected.size) void deleteSelected();
                  }}
                  disabled={selected.size === 0}
                />
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
          ) : null
        }
        count={rows.length}
        selectedCount={selected.size}
        hiddenCount={hiddenSelectionCount(
          selected,
          rows.map((row) => row.id),
        )}
        active={selectMode}
        onStart={() => setSelectMode(true)}
        onDone={exitSelect}
        onSelectAll={() =>
          setSelected((previous) => new Set([...previous, ...rows.map((row) => row.id)]))
        }
      />

      {rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-track">
            <ArrowLeftRight size={26} strokeWidth={1.8} className="text-muted" />
          </span>
          <div className="mt-4 text-[15px] font-semibold text-ink">{t("noMatchTitle")}</div>
          <div className="mt-1 text-[12px] font-medium leading-relaxed text-muted">
            Add your first transaction and it&rsquo;ll show up here.
          </div>
        </div>
      ) : (
        <MobileRecordList
          key={listScope}
          scope={listScope}
          items={rows}
          renderItem={(txn) => (
            <TransactionCard
              key={txn.id}
              txn={txn}
              actions={
                <TransactionRowActions
                  excluded={!!txn.excludeFromBudget}
                  onEdit={() => openTransaction(txn.id)}
                  onExclude={async () => {
                    await bulkExclude([txn.id]);
                  }}
                  onDelete={async () => {
                    await bulkDelete([txn.id]);
                  }}
                />
              }
              selectable={selectMode}
              selected={selected.has(txn.id)}
              onToggle={() => toggleOne(txn.id)}
              onClick={() => openTransaction(txn.id)}
            />
          )}
        />
      )}
    </div>
  );
}
