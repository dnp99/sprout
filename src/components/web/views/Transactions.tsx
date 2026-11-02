"use client";
import { categoryLabel } from "@/lib/categories/labels";
import { BusinessFilter, BusinessActivitySummary } from "@/components/shared/BusinessActivity";
import { useBusinessLedger } from "@/hooks/useBusinessLedger";
import { useScopedSelection } from "@/hooks/useScopedSelection";

import {
  DesktopTransactionRow,
  TRANSACTION_ROW_HEIGHT as ROW_HEIGHT,
} from "@/components/web/DesktopTransactionRow";
import { TransactionColumns } from "@/components/web/TransactionColumns";
import { TransactionTools } from "@/components/shared/TransactionTools";
import { TransactionTotals } from "@/components/web/TransactionTotals";

import { TransactionTypeIcon } from "@/components/ui/TransactionTypeIcon";

import { EntitySymbol } from "@/components/ui/EntitySymbol";

import { useEffect, useRef, useState } from "react";
import { ArrowRightLeft, Search } from "lucide-react";
import { DesktopEmpty } from "@/components/web/DesktopEmpty";
import { CategorizeBacklogButton } from "@/components/shared/CategorizeBacklogButton";
import { ReimbursementInfo } from "@/components/shared/ReimbursementInfo";
import { TransactionFilterRail } from "@/components/web/TransactionFilterRail";
import { TransactionFilters, amountBoundToCents } from "@/components/web/TransactionFilters";
import { DesktopBulkActions } from "@/components/web/DesktopBulkActions";
import {
  TXN_TYPE_CHIPS,
  filterTransactions,
  sortTransactions,
  type SortKey,
  UNASSIGNED_INCOME_SOURCE,
} from "@/lib/search";
import { resolveViewMonth } from "@/lib/trends";
import type { Transaction } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "next-intl";

const VIEWPORT_H = 560;
const OVERSCAN = 6;
const VIRTUALIZE_THRESHOLD = 100;

export function Transactions() {
  const {
    transactions,
    categories,
    incomeSources,
    viewMonthKey,
    webTxnQuery,
    webTxnType,
    txnCategory,
    webSortKey,
    webSortDir,
    webDateFrom,
    webDateTo,
    webAmountMin,
    webAmountMax,
    webTxnCategoryIds,
    set,
    bulkCategorize,
    bulkSetIncomeSource,
    bulkExclude,
    bulkInclude,
    bulkDelete,
  } = useStore(
    useShallow((s) => ({
      transactions: s.transactions,
      categories: s.categories,
      incomeSources: s.incomeSources,
      viewMonthKey: s.viewMonthKey,
      webTxnQuery: s.webTxnQuery,
      webTxnType: s.webTxnType,
      txnCategory: s.txnCategory,
      webSortKey: s.webSortKey,
      webSortDir: s.webSortDir,
      webDateFrom: s.webDateFrom,
      webDateTo: s.webDateTo,
      webAmountMin: s.webAmountMin,
      webAmountMax: s.webAmountMax,
      webTxnCategoryIds: s.webTxnCategoryIds,
      set: s.set,
      bulkCategorize: s.bulkCategorize,
      bulkSetIncomeSource: s.bulkSetIncomeSource,
      bulkExclude: s.bulkExclude,
      bulkInclude: s.bulkInclude,
      bulkDelete: s.bulkDelete,
    })),
  );
  const sourceRows = useBusinessLedger();
  const businessId = useStore((s) => s.txnBusinessId);
  const businessPeriod = useStore((s) => s.txnBusinessPeriod);
  const monthKey = resolveViewMonth(viewMonthKey, transactions);

  // Multi-select for bulk actions (ephemeral UI state).
  const [selected, setSelected] = useScopedSelection(businessId);
  const [manualSelection, setManualSelection] = useState(false);
  const [categoriesCollapsed, setCategoriesCollapsed] = useState(false);
  const [incomeSourceId, setIncomeSourceId] = useState("all");
  // All dates is the default. Both the search dialog and calendar write explicit
  // bounds, so an empty query cannot silently restore a hidden month filter.
  const dateFrom = webDateFrom || undefined;
  const dateTo = webDateTo || undefined;
  const transactionMonthKey =
    businessId !== "all" && businessPeriod === "month" ? monthKey : undefined;
  const scopeRows = filterTransactions(sourceRows, {
    businessId,
    query: webTxnQuery,
    type: webTxnType,
    monthKey: transactionMonthKey,
    dateFrom,
    dateTo,
    amountMin: amountBoundToCents(webAmountMin),
    amountMax: amountBoundToCents(webAmountMax),
  });
  const filtered = filterTransactions(scopeRows, {
    categoryIds:
      webTxnCategoryIds.length > 0 ? webTxnCategoryIds : txnCategory === "all" ? [] : [txnCategory],
    incomeSourceId:
      webTxnType === "income" && incomeSourceId !== "all" ? incomeSourceId : undefined,
  });
  const rows = sortTransactions(filtered, webSortKey, webSortDir);
  // The footer is a cash total for the visible rows. Reimbursements are cash
  // received, so they offset expenses here even though reports never call them income.
  const visibleTotal = filtered
    .filter((transaction) => !transaction.excludeFromBudget)
    .reduce((sum, transaction) => sum + transaction.amountCents, 0);
  const excludedFromTotalCount = filtered.filter(
    (transaction) => transaction.excludeFromBudget,
  ).length;
  const reimbursementsInTotalCount = filtered.filter(
    (transaction) => transaction.kind === "reimbursement" && !transaction.excludeFromBudget,
  ).length;
  const uncategorizedCount = filterTransactions(sourceRows, {
    businessId,
    query: webTxnQuery,
    type: "uncategorized",
    monthKey: transactionMonthKey,
    dateFrom,
    dateTo,
    amountMin: amountBoundToCents(webAmountMin),
    amountMax: amountBoundToCents(webAmountMax),
  }).length;
  const categoryCounts = new Map<string, number>();
  const incomeSourceCounts = new Map<string, number>();
  scopeRows.forEach((txn) => {
    if (txn.categoryId) {
      categoryCounts.set(txn.categoryId, (categoryCounts.get(txn.categoryId) ?? 0) + 1);
    }
    if (txn.isIncome) {
      const sourceId = txn.incomeSourceId ?? UNASSIGNED_INCOME_SOURCE;
      incomeSourceCounts.set(sourceId, (incomeSourceCounts.get(sourceId) ?? 0) + 1);
    }
  });

  const sortBy = (key: SortKey) => {
    if (webSortKey === key) {
      set({ webSortDir: webSortDir === "asc" ? "desc" : "asc" });
    } else {
      set({ webSortKey: key, webSortDir: key === "amount" || key === "date" ? "desc" : "asc" });
    }
  };

  const allVisibleSelected = rows.length > 0 && rows.every((t) => selected.has(t.id));
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected((prev) => {
      if (rows.every((t) => prev.has(t.id))) {
        const next = new Set(prev);
        rows.forEach((t) => next.delete(t.id));
        return next;
      }
      return new Set([...prev, ...rows.map((t) => t.id)]);
    });
  const clearSelection = () => {
    setSelected(new Set());
  };

  // Windowed rendering for large result sets. Reset the scroll to the top
  // whenever the result set changes so you're not stranded mid-list in a shorter
  // one — done imperatively (the resulting scroll event updates scrollTop).
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [
    webTxnType,
    txnCategory,
    incomeSourceId,
    webTxnCategoryIds,
    webTxnQuery,
    webSortKey,
    webSortDir,
    monthKey,
  ]);

  const virtualize = rows.length > VIRTUALIZE_THRESHOLD;
  // Clamp in case state lags a shrinking list for a frame.
  const clampedTop = Math.min(scrollTop, Math.max(0, rows.length * ROW_HEIGHT - VIEWPORT_H));
  const start = virtualize ? Math.max(0, Math.floor(clampedTop / ROW_HEIGHT) - OVERSCAN) : 0;
  const end = virtualize
    ? Math.min(rows.length, Math.ceil((clampedTop + VIEWPORT_H) / ROW_HEIGHT) + OVERSCAN)
    : rows.length;
  const visibleRows = rows.slice(start, end);
  const selectedTransactions = transactions.filter((transaction) => selected.has(transaction.id));

  const t = useTranslations("txns");
  const searchingAllDates = !dateFrom && !dateTo;
  const selectionMode = manualSelection || selected.size > 0;
  const renderRow = (txn: Transaction, index: number) => (
    <DesktopTransactionRow
      key={txn.id}
      txn={txn}
      stripeIndex={start + index}
      isSelected={selected.has(txn.id)}
      selectionMode={selectionMode}
      searchingAllDates={searchingAllDates}
      toggleOne={toggleOne}
    />
  );

  return (
    <div
      className={`mt-[18px] grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] gap-[14px] transition-[grid-template-columns] duration-200 ${
        categoriesCollapsed
          ? "grid-cols-[44px_minmax(0,1fr)]"
          : "grid-cols-[190px_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,1fr)]"
      }`}
    >
      {webTxnType === "income" ? (
        <TransactionFilterRail
          title={t("incomeSourcesLabel")}
          description={t("chooseIncomeSource")}
          allLabel={t("allIncomeSources")}
          items={[
            {
              id: UNASSIGNED_INCOME_SOURCE,
              label: t("unassignedIncome"),
              icon: <EntitySymbol emoji="💰" />,
            },
            ...incomeSources.map((source) => ({
              id: source.id,
              label: source.name,
              icon: (
                <span className="text-[16px] leading-none">
                  <EntitySymbol emoji={source.emoji} />
                </span>
              ),
            })),
          ]}
          activeId={incomeSourceId}
          totalCount={scopeRows.length}
          counts={incomeSourceCounts}
          onSelect={setIncomeSourceId}
          collapsed={categoriesCollapsed}
          onToggleCollapsed={() => setCategoriesCollapsed((value) => !value)}
          collapseLabel={t("collapseIncomeSources")}
          expandLabel={t("expandIncomeSources")}
        />
      ) : (
        <TransactionFilterRail
          title={t("categoriesLabel")}
          description={t("chooseCategory")}
          allLabel={t("allCategories")}
          items={categories.map((category) => ({
            id: category.id,
            label: categoryLabel(categories, category),
            icon: (
              <span className="text-[16px] leading-none">
                <EntitySymbol emoji={category.emoji} color={category.color} />
              </span>
            ),
          }))}
          activeId={txnCategory}
          totalCount={scopeRows.length}
          counts={categoryCounts}
          onSelect={(categoryId) =>
            set({
              txnCategory: categoryId,
              webTxnCategoryIds: categoryId === "all" ? [] : [categoryId],
            })
          }
          collapsed={categoriesCollapsed}
          onToggleCollapsed={() => setCategoriesCollapsed((value) => !value)}
          collapseLabel={t("collapseCategories")}
          expandLabel={t("expandCategories")}
        />
      )}

      <section className="flex h-full min-h-0 min-w-0 flex-col gap-3">
        <TransactionTools />
        {businessId === "all" && <CategorizeBacklogButton />}
        <BusinessFilter />
        <BusinessActivitySummary rows={filtered} />

        {/* Transaction-type filters — bare pills on the canvas (no parent card) */}
        <div className="flex flex-wrap items-center gap-[9px]">
          {TXN_TYPE_CHIPS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              onClick={() => set({ webTxnType: chip.value })}
              data-filter-kind={chip.value}
              className={`cozy-type-chip whitespace-nowrap rounded-full px-[13px] py-[7px] text-[12px] transition ${
                webTxnType === chip.value
                  ? "bg-primary font-semibold text-onprimary"
                  : "border border-edge bg-card font-medium text-muted hover:text-ink"
              }`}
            >
              <TransactionTypeIcon type={chip.value} />
              {t(chip.labelKey)}
              {chip.value === "uncategorized" && uncategorizedCount > 0
                ? ` ${uncategorizedCount}`
                : ""}
            </button>
          ))}
        </div>

        {webTxnType === "reimbursement" && <ReimbursementInfo />}

        <div className="flex items-center justify-end gap-2">
          <TransactionFilters />
          <button
            type="button"
            className="selection-action min-h-11 rounded-[10px] border border-edge px-3 text-[12.5px] font-semibold"
            onClick={() => {
              if (selectionMode) {
                clearSelection();
                setManualSelection(false);
              } else setManualSelection(true);
            }}
          >
            {t(selectionMode ? "done" : "select")}
          </button>
        </div>

        {/* Empty state — no transactions at all, or none matching the filters. */}
        {rows.length === 0 ? (
          <div className="cozy-transaction-table flex min-h-0 flex-1 flex-col overflow-clip rounded-[14px] border border-edge bg-card">
            {transactions.length === 0 ? (
              <DesktopEmpty
                icon={ArrowRightLeft}
                title={t("emptyTitle")}
                description="Connect an account or import a CSV, and your transactions will show up here."
              >
                <button
                  type="button"
                  onClick={() => set({ webView: "import" })}
                  className="rounded-[10px] bg-primary px-5 py-[11px] text-[13px] font-semibold text-onprimary"
                >
                  Import CSV
                </button>
                <button
                  type="button"
                  onClick={() => set({ webAddOpen: true })}
                  className="rounded-[10px] border border-edge px-5 py-[11px] text-[13px] font-semibold"
                >
                  Add manually
                </button>
              </DesktopEmpty>
            ) : (
              <DesktopEmpty icon={Search} title={t("noMatchTitle")} description={t("noMatchBody")}>
                <button
                  type="button"
                  onClick={() => {
                    setIncomeSourceId("all");
                    set({
                      webTxnQuery: "",
                      webTxnType: "all",
                      txnCategory: "all",
                      webTxnCategoryIds: [],
                    });
                  }}
                  className="rounded-[10px] bg-primary px-5 py-[11px] text-[13px] font-semibold text-onprimary"
                >
                  Clear filters
                </button>
              </DesktopEmpty>
            )}
          </div>
        ) : (
          <div className="cozy-transaction-table flex min-h-0 flex-1 flex-col overflow-clip rounded-[14px] border border-edge bg-card">
            {/* The column header and selection actions share one fixed-height
                slot. Swapping content within a stable box avoids covering the
                first row or changing the scroll viewport when selection starts. */}
            <div className="cozy-transaction-head relative z-20 h-[58px] shrink-0 border-b border-edge bg-card">
              {selectedTransactions.length > 0 ? (
                <div className="flex h-full items-center px-3">
                  <DesktopBulkActions
                    selectedTransactions={selectedTransactions}
                    categories={categories}
                    incomeSources={incomeSources}
                    onCategorize={bulkCategorize}
                    onSetIncomeSource={bulkSetIncomeSource}
                    onExclude={bulkExclude}
                    onInclude={bulkInclude}
                    onDelete={bulkDelete}
                    onClear={clearSelection}
                  />
                </div>
              ) : (
                <TransactionColumns
                  allSelected={allVisibleSelected}
                  toggleAll={toggleAll}
                  webSortKey={webSortKey}
                  webSortDir={webSortDir}
                  webTxnType={webTxnType}
                  categoryFiltered={
                    webTxnType === "income" ? incomeSourceId !== "all" : txnCategory !== "all"
                  }
                  sortBy={sortBy}
                />
              )}
            </div>

            {virtualize ? (
              <div
                ref={scrollRef}
                onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
                className="record-list min-h-0 flex-1 overflow-y-auto overscroll-contain [overflow-anchor:none]"
              >
                {/* Full-height spacer preserves the scrollbar; the window is offset in. */}
                <div style={{ height: rows.length * ROW_HEIGHT, position: "relative" }}>
                  <div
                    className="record-list"
                    style={{ transform: `translateY(${start * ROW_HEIGHT}px)` }}
                  >
                    {visibleRows.map(renderRow)}
                  </div>
                </div>
              </div>
            ) : (
              <div
                ref={scrollRef}
                className="record-list min-h-0 flex-1 overflow-y-auto overscroll-contain [overflow-anchor:none]"
              >
                {rows.map(renderRow)}
              </div>
            )}

            <TransactionTotals
              count={filtered.length}
              excludedCount={excludedFromTotalCount}
              reimbursementCount={reimbursementsInTotalCount}
              totalCents={visibleTotal}
            />
          </div>
        )}
      </section>
    </div>
  );
}
