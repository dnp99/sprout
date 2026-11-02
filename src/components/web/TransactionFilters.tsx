"use client";

import { EntitySymbol } from "@/components/ui/EntitySymbol";

import { useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/state/store";
import { SearchDialog } from "@/components/shared/SearchDialog";
import { SearchDateScope } from "@/components/shared/SearchDateScope";
import { SavedViews } from "./SavedViews";
import { resolveViewMonth } from "@/lib/trends";

/** Personal search shares one dialog across responsive surfaces. Explicit date
 * bounds also serve calendar navigation, so no hidden month narrows the query. */
export function TransactionFilters({ mobile = false }: { mobile?: boolean }) {
  const t = useTranslations("txns");
  const state = useStore(
    useShallow((s) => ({
      categories: s.categories,
      transactions: s.transactions,
      month: s.viewMonthKey,
      query: mobile ? s.searchQuery : s.webTxnQuery,
      dateFrom: s.webDateFrom,
      dateTo: s.webDateTo,
      amountMin: mobile ? s.searchAmountMin : s.webAmountMin,
      amountMax: mobile ? s.searchAmountMax : s.webAmountMax,
      categoryIds: mobile ? s.searchCategoryIds : s.webTxnCategoryIds,
      set: s.set,
    })),
  );
  const { set } = state;
  const field =
    "min-h-11 w-full rounded-[8px] border border-edge bg-card px-2.5 text-base text-ink";
  return (
    <SearchDialog
      shortcut={!mobile}
      query={state.query}
      onQueryChange={(value) => set(mobile ? { searchQuery: value } : { webTxnQuery: value })}
    >
      <SearchDateScope
        month={resolveViewMonth(state.month, state.transactions)}
        from={state.dateFrom}
        to={state.dateTo}
        onChange={(from, to) =>
          set(
            mobile
              ? { searchDateFrom: from, searchDateTo: to, webDateFrom: from, webDateTo: to }
              : { webDateFrom: from, webDateTo: to },
          )
        }
      />
      <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
        {state.categories.map((category) => {
          const active = state.categoryIds.includes(category.id);
          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                const ids = active
                  ? state.categoryIds.filter((id) => id !== category.id)
                  : [...state.categoryIds, category.id];
                set(
                  mobile
                    ? {
                        searchCategoryIds: ids,
                        searchCategoryId: ids.length === 1 ? ids[0] : "all",
                        txnCategory: "all",
                      }
                    : { webTxnCategoryIds: ids, txnCategory: "all" },
                );
              }}
              className={`min-h-11 rounded-[8px] border px-2 text-[12px] ${active ? "border-primary bg-primary-soft text-primary" : "border-edge text-muted"}`}
            >
              <EntitySymbol emoji={category.emoji} /> {category.name}
            </button>
          );
        })}
      </div>
      <div>
        <div className="mb-2 text-[12px] font-medium text-muted">{t("amountRange")}</div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            inputMode="decimal"
            aria-label={t("min")}
            placeholder={t("min")}
            className={field}
            value={state.amountMin}
            onChange={(event) =>
              set(
                mobile
                  ? { searchAmountMin: event.target.value }
                  : { webAmountMin: event.target.value },
              )
            }
          />
          <input
            type="number"
            min="0"
            inputMode="decimal"
            aria-label={t("max")}
            placeholder={t("max")}
            className={field}
            value={state.amountMax}
            onChange={(event) =>
              set(
                mobile
                  ? { searchAmountMax: event.target.value }
                  : { webAmountMax: event.target.value },
              )
            }
          />
        </div>
      </div>
      <SavedViews mobile={mobile} />
      <button
        type="button"
        className={field}
        onClick={() =>
          set(
            mobile
              ? {
                  searchQuery: "",
                  searchDateFrom: "",
                  searchDateTo: "",
                  webDateFrom: "",
                  webDateTo: "",
                  searchAmountMin: "",
                  searchAmountMax: "",
                  searchCategoryIds: [],
                  searchCategoryId: "all",
                  txnCategory: "all",
                }
              : {
                  webTxnQuery: "",
                  webDateFrom: "",
                  webDateTo: "",
                  webAmountMin: "",
                  webAmountMax: "",
                  webTxnCategoryIds: [],
                  txnCategory: "all",
                },
          )
        }
      >
        {t("clearFilters")}
      </button>
    </SearchDialog>
  );
}

/** Parse a dollar-string amount bound (e.g. "60", "12.50") to a magnitude in
 *  cents, or null when empty/invalid. Exported for the table's filter build. */
export function amountBoundToCents(value: string): number | null {
  const n = Number.parseFloat(value);
  if (!value.trim() || n !== n) return null;
  return Math.round(Math.abs(n) * 100);
}
