"use client";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/state/store";
import { ReimbursementInfo } from "@/components/shared/ReimbursementInfo";
import { TransactionFilterControl } from "@/components/shared/TransactionFilterControl";
import { SavedViews } from "./SavedViews";
import { resolveViewMonth } from "@/lib/trends";
import { categoryLabel } from "@/lib/categories/labels";
import { useFormatters } from "@/i18n/useFormatters";
import { NO_BUSINESS } from "@/lib/businesses/activity";
import { emptyFilterDraft, filterAmount, type FilterDraft } from "@/lib/transactions/filter-draft";
import { TXN_SORTS, type TxnSort, type SortKey, type SortDir } from "@/lib/search";
import type { TxnFilter } from "@/lib/types";

/** Personal adapters keep the existing responsive store fields and saved views;
 * shared controls never write Group state or commit while the draft is edited. */
export function TransactionFilters({
  mobile = false,
  sort,
  onSort,
  incomeSourceFilter = "all",
  onIncomeSourceChange,
  income = false,
}: {
  mobile?: boolean;
  sort?: TxnSort;
  onSort?: (sort: TxnSort) => void;
  incomeSourceFilter?: string;
  onIncomeSourceChange?: (value: string) => void;
  income?: boolean;
}) {
  const t = useTranslations("txns"),
    b = useTranslations("businessActivity");
  const fmt = useFormatters();
  const s = useStore(
    useShallow((s) => ({
      categories: s.categories,
      businesses: s.businesses,
      incomeSources: s.incomeSources,
      business: s.txnBusinessId,
      period: s.txnBusinessPeriod,
      month: s.viewMonthKey,
      transactions: s.transactions,
      query: mobile ? s.searchQuery : s.webTxnQuery,
      categoryIds: mobile ? s.searchCategoryIds : s.webTxnCategoryIds,
      category: s.txnCategory,
      min: mobile ? s.searchAmountMin : s.webAmountMin,
      max: mobile ? s.searchAmountMax : s.webAmountMax,
      from: s.webDateFrom,
      to: s.webDateTo,
      allDates: s.mobileTxnAllDates,
      primary: s.webTxnType,
      quick: mobile ? s.searchType : s.webTxnQuickType !== "all" ? s.webTxnQuickType : s.webTxnType,
      sortKey: s.webSortKey,
      sortDir: s.webSortDir,
      set: s.set,
    })),
  );
  const meta = TXN_SORTS.find((o) => o.value === sort) ?? TXN_SORTS[0];
  const applied: FilterDraft = {
    ...emptyFilterDraft,
    categories: s.categoryIds.length ? s.categoryIds : s.category === "all" ? [] : [s.category],
    min: fmt.locale === "fr-CA" ? s.min.replace(".", ",") : s.min,
    max: fmt.locale === "fr-CA" ? s.max.replace(".", ",") : s.max,
    from: s.from,
    to: s.to,
    quick: ["reimbursement", "uncategorized", "excluded"].includes(s.quick) ? s.quick : "",
    sort: mobile ? `${meta.key}:${meta.dir}` : `${s.sortKey}:${s.sortDir}`,
    scope: mobile && !s.allDates ? "month" : "all",
    business: s.business,
    period: s.period,
    source: incomeSourceFilter,
  };
  const apply = (draft: FilterDraft) => {
    const [key, dir] = draft.sort.split(":");
    s.set({
      txnBusinessId: draft.business,
      txnBusinessPeriod: draft.period === "all" ? "all" : "month",
      txnCategory: draft.categories.length === 1 ? draft.categories[0] : "all",
      webDateFrom: draft.from,
      webDateTo: draft.to,
      ...(mobile
        ? {
            searchAmountMin: draft.min.replace(",", "."),
            searchAmountMax: draft.max.replace(",", "."),
            searchCategoryIds: draft.categories,
            searchCategoryId: draft.categories.length === 1 ? draft.categories[0] : "all",
            searchType: (draft.quick || "all") as TxnFilter,
            searchDateFrom: draft.from,
            searchDateTo: draft.to,
            mobileTxnAllDates: draft.scope === "all",
          }
        : {
            webAmountMin: draft.min.replace(",", "."),
            webAmountMax: draft.max.replace(",", "."),
            webTxnCategoryIds: draft.categories,
            webTxnType: s.primary === "expense" || s.primary === "income" ? s.primary : "all",
            webTxnQuickType: (draft.quick || "all") as TxnFilter,
            webSortKey: key as SortKey,
            webSortDir: dir as SortDir,
          }),
    });
    if (mobile) onSort?.(TXN_SORTS.find((o) => o.key === key && o.dir === dir)?.value ?? "newest");
    onIncomeSourceChange?.(draft.source);
  };
  const sortKeys = mobile ? ["date", "amount"] : ["date", "amount", "merchant", "category"];
  return (
    <div className="min-w-0 flex-1">
      <TransactionFilterControl
        applied={applied}
        onApply={apply}
        query={s.query}
        shortcut={!mobile}
        onQueryChange={(value) => s.set(mobile ? { searchQuery: value } : { webTxnQuery: value })}
        config={{
          multipleCategories: true,
          defaultMonth: mobile,
          month: resolveViewMonth(s.month, s.transactions),
          categories: s.categories.map((c) => ({
            value: c.id,
            label: categoryLabel(s.categories, c),
          })),
          sorts: sortKeys.flatMap((key) =>
            (["desc", "asc"] as const).map((dir) => ({
              value: `${key}:${dir}`,
              label:
                key === "date"
                  ? t(dir === "desc" ? "newest" : "oldest")
                  : key === "amount"
                    ? t(dir === "desc" ? "highest" : "lowest")
                    : `${t(key === "merchant" ? "colMerchant" : "colCategory")} · ${t(dir === "asc" ? "ascending" : "descending")}`,
            })),
          ),
          quick: [
            { value: "reimbursement", label: t("chipRefunds") },
            { value: "uncategorized", label: t("chipUncategorized") },
            { value: "excluded", label: t("chipExcluded") },
          ],
          businesses: [
            { value: "all", label: b("allBusinesses") },
            { value: NO_BUSINESS, label: b("noBusiness") },
            ...s.businesses.map((o) => ({ value: o.id, label: o.name })),
          ],
          sources: income
            ? [
                { value: "all", label: t("allIncomeSources") },
                ...s.incomeSources.map((o) => ({ value: o.id, label: o.name })),
              ]
            : undefined,
        }}
      />
      <div className="mt-2">
        <SavedViews mobile={mobile} />
      </div>
      {mobile && s.quick === "reimbursement" && <ReimbursementInfo compact className="mt-2" />}
    </div>
  );
}

/** Existing result pipelines consume the same strict localized cents parser. */
export function amountBoundToCents(value: string): number | null {
  return filterAmount(value);
}
