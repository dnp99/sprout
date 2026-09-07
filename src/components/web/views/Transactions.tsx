"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRightLeft,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Plus,
  Search,
  X,
} from "lucide-react";
import { DesktopEmpty } from "@/components/web/DesktopEmpty";
import { Checkbox } from "@/components/ui/Checkbox";
import { CategorizeBacklogButton } from "@/components/shared/CategorizeBacklogButton";
import { InlineCategoryPicker } from "@/components/shared/InlineCategoryPicker";
import { ReimbursementInfo } from "@/components/shared/ReimbursementInfo";
import { TxnTags } from "@/components/ui/TxnTags";
import { TransactionFilterRail } from "@/components/web/TransactionFilterRail";
import { TransactionFilters, amountBoundToCents } from "@/components/web/TransactionFilters";
import { SavedViews } from "@/components/web/SavedViews";
import { DesktopBulkActions } from "@/components/web/DesktopBulkActions";
import { TransactionRowActions } from "@/components/web/TransactionRowActions";
import { formatMoney } from "@/lib/format";
import {
  TXN_TYPE_CHIPS,
  filterTransactions,
  sortTransactions,
  type SortKey,
  UNASSIGNED_INCOME_SOURCE,
  webTransactionMonthKey,
} from "@/lib/search";
import { resolveViewMonth } from "@/lib/trends";
import type { Transaction } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { useFormatters } from "@/i18n/useFormatters";
import { useTranslations } from "next-intl";

const COLUMNS: { key: SortKey; label: string; align?: string }[] = [
  { key: "merchant", label: "colMerchant" },
  { key: "category", label: "colCategory" },
  { key: "date", label: "colDate" },
  { key: "amount", label: "colAmount", align: "justify-end pr-2 text-right" },
];

// Shared grid template so header + rows align (checkbox / merchant / category /
// date / amount / actions) — mirrors the design's core table grid with a
// compact trailing action affordance.
const GRID =
  "grid grid-cols-[32px_minmax(0,2.4fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_40px] items-center";

// Virtualization: past this many rows, render only the visible window inside a
// scroll box (fixed row height) so a 5,000-row list stays smooth.
const ROW_HEIGHT = 53;
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
  const monthKey = resolveViewMonth(viewMonthKey, transactions);

  // Multi-select for bulk actions (ephemeral UI state).
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [categoriesCollapsed, setCategoriesCollapsed] = useState(false);
  const [incomeSourceId, setIncomeSourceId] = useState("all");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Slash focuses transaction search from anywhere outside an editable field.
  // This keeps the shortcut useful without intercepting ordinary typing.
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      const target = event.target;
      const editing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable);

      if (event.key === "/" && !editing && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  // Free-text search spans all loaded history. With no query, the regular table
  // follows the month stepper while backlog filters remain all-month views. An
  // explicit advanced date range (B1) also overrides the month scope.
  const dateFrom = webDateFrom || undefined;
  const dateTo = webDateTo || undefined;
  const transactionMonthKey =
    dateFrom || dateTo ? undefined : webTransactionMonthKey(webTxnQuery, monthKey);
  const scopeRows = filterTransactions(transactions, {
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
  // The table can show excluded rows for review, but its footer must agree with
  // Budget and Trends: excluded activity is never part of the reported total.
  const reportedTotal = filtered
    .filter((transaction) => !transaction.excludeFromBudget)
    .reduce((sum, transaction) => sum + transaction.amountCents, 0);
  const excludedFromTotalCount = filtered.filter(
    (transaction) => transaction.excludeFromBudget,
  ).length;
  const uncategorizedCount = filterTransactions(transactions, {
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

  const fmt = useFormatters();
  const t = useTranslations("txns");
  const tNav = useTranslations("nav");
  const searchingAllDates = webTxnQuery.trim().length > 0;
  const selectionMode = selected.size > 0;
  const renderRow = (txn: Transaction) => {
    const openEdit = () => set({ webEditTxnId: txn.id });
    const isSelected = selected.has(txn.id);
    return (
      <div
        key={txn.id}
        style={{ height: ROW_HEIGHT }}
        onPointerDownCapture={(event) => {
          // Native selects open on pointer down. Suppress that default while
          // bulk selection is active so every part of the row has one meaning.
          if (selectionMode) event.preventDefault();
        }}
        onClickCapture={(event) => {
          if (!selectionMode) return;
          event.preventDefault();
          event.stopPropagation();
          toggleOne(txn.id);
        }}
        className={`txrow group ${GRID} cursor-pointer border-t border-edge px-3 transition ${
          isSelected ? "bg-track" : "hover:bg-track"
        }`}
      >
        <span className="flex h-full items-center">
          <Checkbox
            checked={isSelected}
            onChange={() => toggleOne(txn.id)}
            label={`Select ${txn.merchant}`}
            // bg-track (hover/selected) equals border-edge in dark mode, so lift
            // the unchecked box's border there to keep it visible.
            className="group-hover:[&>span]:border-subtle"
          />
        </span>
        <button
          type="button"
          onClick={openEdit}
          title={selectionMode ? t("clickToSelect") : t("clickToEdit")}
          className="flex h-full min-w-0 items-center gap-[11px] pr-2 text-left"
        >
          <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] bg-track text-[11px] font-semibold">
            {txn.merchant.charAt(0).toUpperCase()}
          </span>
          <span className="truncate text-[13.5px] font-semibold">{txn.merchant}</span>
          <TxnTags txn={txn} />
        </button>
        <div className="flex h-full items-center pr-2 text-[13px]">
          <InlineCategoryPicker txn={txn} disabled={selectionMode} />
        </div>
        <button
          type="button"
          onClick={openEdit}
          title={selectionMode ? t("clickToSelect") : t("clickToEdit")}
          className="flex h-full items-center text-left text-[12.5px] font-medium text-muted"
        >
          {searchingAllDates ? fmt.txnSearchDate(txn.occurredAt) : fmt.txnDate(txn.occurredAt)}
        </button>
        <button
          type="button"
          onClick={openEdit}
          title={selectionMode ? t("clickToSelect") : t("clickToEdit")}
          className={`flex h-full items-center justify-end pr-2 text-right text-[13.5px] font-semibold tabular-nums ${
            txn.isIncome ? "text-green" : ""
          }`}
        >
          {formatMoney(txn.amountCents, { signed: true })}
        </button>
        <TransactionRowActions
          excluded={Boolean(txn.excludeFromBudget)}
          onEdit={openEdit}
          onExclude={async () => {
            await bulkExclude([txn.id]);
          }}
          onDelete={async () => {
            await bulkDelete([txn.id]);
          }}
        />
      </div>
    );
  };

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
            { id: UNASSIGNED_INCOME_SOURCE, label: t("unassignedIncome"), icon: <span>💰</span> },
            ...incomeSources.map((source) => ({
              id: source.id,
              label: source.name,
              icon: <span className="text-[16px] leading-none">{source.emoji}</span>,
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
            label: category.name,
            icon: <span className="text-[16px] leading-none">{category.emoji}</span>,
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
        {/* Search + actions — bare on the canvas (no parent card) */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-11 flex-1 items-center gap-2 rounded-[10px] border border-edge bg-card px-[13px] transition-colors focus-within:border-primary">
            <Search size={15} strokeWidth={2} className="flex-none text-muted" />
            <input
              ref={searchInputRef}
              value={webTxnQuery}
              onChange={(e) => set({ webTxnQuery: e.target.value })}
              placeholder={t("searchPlaceholder")}
              onKeyDown={(event) => {
                if (event.key === "Escape" && webTxnQuery) {
                  event.preventDefault();
                  set({ webTxnQuery: "" });
                }
              }}
              className="flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
            />
            {searchingAllDates && (
              <span className="flex-none rounded-full bg-track px-2 py-1 text-[10.5px] font-semibold text-muted">
                {t("allDates")}
              </span>
            )}
            {webTxnQuery ? (
              <button
                type="button"
                onClick={() => {
                  set({ webTxnQuery: "" });
                  searchInputRef.current?.focus();
                }}
                aria-label={t("clearSearch")}
                title={t("clearSearch")}
                className="flex h-8 w-8 flex-none items-center justify-center rounded-[8px] text-muted transition hover:bg-track hover:text-ink"
              >
                <X size={15} strokeWidth={2} />
              </button>
            ) : (
              <kbd
                aria-label={t("focusSearchShortcut")}
                className="flex h-6 min-w-6 flex-none items-center justify-center rounded-[6px] border border-edge px-1.5 text-[11px] font-medium text-subtle"
              >
                /
              </kbd>
            )}
          </div>
          <CategorizeBacklogButton />
          {/* Primary add action anchors the right edge of the search toolbar
              (moved here from the page header). */}
          <button
            type="button"
            onClick={() => set({ webAddOpen: true })}
            className="flex flex-none items-center gap-1.5 whitespace-nowrap rounded-[10px] bg-primary px-[15px] py-[9px] text-[12.5px] font-semibold text-onprimary"
          >
            <Plus size={15} strokeWidth={2.6} />
            {tNav("addTransaction")}
          </button>
        </div>

        {/* Transaction-type filters — bare pills on the canvas (no parent card) */}
        <div className="flex flex-wrap items-center gap-[9px]">
          {TXN_TYPE_CHIPS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              onClick={() => set({ webTxnType: chip.value })}
              className={`whitespace-nowrap rounded-full px-[13px] py-[7px] text-[12px] transition ${
                webTxnType === chip.value
                  ? "bg-primary font-semibold text-onprimary"
                  : "border border-edge bg-card font-medium text-muted hover:text-ink"
              }`}
            >
              {t(chip.labelKey)}
              {chip.value === "uncategorized" && uncategorizedCount > 0
                ? ` ${uncategorizedCount}`
                : ""}
            </button>
          ))}
          <TransactionFilters />
          <SavedViews />
        </div>

        {webTxnType === "reimbursement" && <ReimbursementInfo />}

        {/* Empty state — no transactions at all, or none matching the filters. */}
        {rows.length === 0 ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-clip rounded-[14px] border border-edge bg-card">
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
          <div className="flex min-h-0 flex-1 flex-col overflow-clip rounded-[14px] border border-edge bg-card">
            {/* The column header and selection actions share one fixed-height
                slot. Swapping content within a stable box avoids covering the
                first row or changing the scroll viewport when selection starts. */}
            <div className="relative z-20 h-[58px] shrink-0 border-b border-edge bg-card">
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
                <div
                  className={`${GRID} h-full select-none px-3 text-[11px] font-semibold uppercase tracking-[.03em] text-muted`}
                >
                  <Checkbox
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    label={t("selectAll")}
                  />
                  {COLUMNS.map((col) => {
                    const active = webSortKey === col.key;
                    const labelKey =
                      col.key === "category" && webTxnType === "income"
                        ? "colIncomeSource"
                        : col.label;
                    const filtered =
                      col.key === "category" &&
                      (webTxnType === "income" ? incomeSourceId !== "all" : txnCategory !== "all");
                    return (
                      <button
                        key={col.key}
                        type="button"
                        onClick={() => sortBy(col.key)}
                        title={t("sortBy", { column: t(labelKey).toLowerCase() })}
                        className={`flex items-center gap-1 ${col.align ?? ""} ${
                          filtered ? "text-primary" : active ? "text-ink" : ""
                        }`}
                      >
                        {t(labelKey).toUpperCase()}
                        {active ? (
                          webSortDir === "asc" ? (
                            <ChevronUp size={11} strokeWidth={2.5} />
                          ) : (
                            <ChevronDown size={11} strokeWidth={2.5} />
                          )
                        ) : (
                          <ChevronsUpDown size={11} strokeWidth={2.5} className="opacity-70" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {virtualize ? (
              <div
                ref={scrollRef}
                onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain [overflow-anchor:none]"
              >
                {/* Full-height spacer preserves the scrollbar; the window is offset in. */}
                <div style={{ height: rows.length * ROW_HEIGHT, position: "relative" }}>
                  <div style={{ transform: `translateY(${start * ROW_HEIGHT}px)` }}>
                    {visibleRows.map(renderRow)}
                  </div>
                </div>
              </div>
            ) : (
              <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain [overflow-anchor:none]"
              >
                {rows.map(renderRow)}
              </div>
            )}

            <div className="flex items-center justify-between gap-4 border-t border-primary px-3 py-3">
              <span className="flex flex-col text-[12px] font-medium text-muted">
                <span>{t("summaryCount", { count: filtered.length })}</span>
                {excludedFromTotalCount > 0 && (
                  <span className="text-[11px] text-subtle">
                    {t("excludedFromTotal", { count: excludedFromTotalCount })}
                  </span>
                )}
              </span>
              <span
                className={`text-[16px] font-bold tabular-nums ${reportedTotal >= 0 ? "text-green" : "text-ink"}`}
              >
                {fmt.money(reportedTotal, { signed: true })}
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
