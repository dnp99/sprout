"use client";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useDesktop } from "@/hooks/useDesktop";
import { useTransactionFieldVisibility } from "@/hooks/useTransactionFieldVisibility";
import { FilterScrollHint } from "./FilterScrollHint";
import { Toggle } from "@/components/ui/controls";
import { Select } from "@/components/ui/Select";
import { SearchDateScope } from "./SearchDateScope";
import { useFormatters } from "@/i18n/useFormatters";
import {
  resetFilterDraft,
  validFilterDraft,
  type FilterDraft,
} from "@/lib/transactions/filter-draft";

export interface FilterOption {
  value: string;
  label: string;
}
export interface FilterConfig {
  multipleCategories?: boolean;
  categories: FilterOption[];
  payers?: FilterOption[];
  sorts: FilterOption[];
  quick: FilterOption[];
  businesses?: FilterOption[];
  sources?: FilterOption[];
  month: string;
  defaultMonth?: boolean;
}
export const filterField =
  "min-h-11 w-full rounded-[8px] border border-edge bg-card px-3 text-control text-ink";

/** One mounted draft per open session; adapters commit only on valid submission. */
export function TransactionFilterEditor({
  applied,
  config,
  onApply,
  onClose,
}: {
  applied: FilterDraft;
  config: FilterConfig;
  onApply: (draft: FilterDraft) => void;
  onClose: () => void;
}) {
  const t = useTranslations("txns"),
    g = useTranslations("groups"),
    b = useTranslations("businessActivity");
  const fmt = useFormatters();
  const desktop = useDesktop();
  const scrollRef = useRef<HTMLDivElement>(null);
  useTransactionFieldVisibility(scrollRef, !desktop);
  const [draft, setDraft] = useState(applied);
  const [dateRevision, setDateRevision] = useState(0);
  const patch = (value: Partial<FilterDraft>) => setDraft((old) => ({ ...old, ...value }));
  const valid = validFilterDraft(draft, fmt.locale);
  const choose = (
    label: string,
    key: "payer" | "sort" | "business" | "period" | "source",
    options: FilterOption[],
  ) => (
    <label className="grid min-w-0 gap-1.5 text-label text-muted">
      <span>{label}</span>
      <Select
        aria-label={label}
        className={filterField}
        value={draft[key]}
        onChange={(e) => patch({ [key]: e.target.value })}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </label>
  );
  return (
    <form
      className="transaction-filter-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) {
          onApply(draft);
          onClose();
        }
      }}
    >
      <div ref={scrollRef} className="transaction-filter-fields">
        <div className="space-y-4">
          <fieldset className="min-w-0">
            <legend className="mb-1.5 text-label text-muted">{t("category")}</legend>
            <div className="flex max-h-40 flex-col gap-1 overflow-y-auto">
              {config.categories.map((o) => (
                <label
                  key={o.value}
                  className="flex min-h-11 min-w-0 items-center gap-2 rounded-[8px] px-2 text-body hover:bg-track"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 accent-[var(--primary)]"
                    checked={draft.categories.includes(o.value)}
                    onChange={(e) =>
                      patch({
                        categories: !config.multipleCategories
                          ? e.target.checked
                            ? [o.value]
                            : []
                          : e.target.checked
                            ? [...draft.categories, o.value]
                            : draft.categories.filter((id) => id !== o.value),
                      })
                    }
                  />
                  <span className="min-w-0 break-words">{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {config.payers && choose(g("paidBy"), "payer", config.payers)}
          {config.sources && choose(t("selectIncomeSource"), "source", config.sources)}
          <fieldset>
            <legend className="mb-1.5 text-label text-muted">
              {t("amountRange")} ({fmt.money(0, { forceCents: true })})
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {(["min", "max"] as const).map((key) => (
                <label key={key} className="grid min-w-0 gap-1 text-label text-muted">
                  {t(key)}
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    aria-label={t(key)}
                    value={draft[key]}
                    aria-invalid={!valid || undefined}
                    aria-describedby={!valid ? "filter-validation" : undefined}
                    className={filterField}
                    onChange={(e) => patch({ [key]: e.target.value })}
                  />
                </label>
              ))}
            </div>
          </fieldset>
          {choose(t("sortLabel"), "sort", config.sorts)}
          <fieldset className="min-w-0">
            <legend className="mb-1.5 text-label text-muted">{t("dateRange")}</legend>
            <SearchDateScope
              key={dateRevision}
              from={draft.from}
              to={draft.to}
              month={config.month}
              defaultMonth={draft.scope === "month"}
              onChange={(from, to) => patch({ from, to, scope: "all" })}
            />
            <p className="mt-2 text-meta text-muted">
              {t("dateScopeHint", {
                scope:
                  draft.from || draft.to
                    ? `${draft.from} – ${draft.to}`
                    : draft.scope === "all"
                      ? g("allDates")
                      : fmt.monthKey(config.month),
              })}
            </p>
          </fieldset>
          <div className="space-y-1">
            {config.quick.map((o) => (
              <div
                key={o.value}
                className="flex min-h-11 items-center justify-between gap-2 text-body"
              >
                <span className="min-w-0 break-words">{o.label}</span>
                <Toggle
                  label={o.label}
                  on={draft.quick === o.value}
                  onClick={() => patch({ quick: draft.quick === o.value ? "" : o.value })}
                />
              </div>
            ))}
          </div>
          {config.businesses && (
            <>
              {choose(b("filter"), "business", config.businesses)}
              {draft.business !== "all" &&
                choose(b("period"), "period", [
                  { value: "month", label: b("selectedMonth") },
                  { value: "all", label: b("allDates") },
                ])}
            </>
          )}
          {!valid && (
            <p id="filter-validation" role="alert" className="text-body text-danger">
              {t("invalidFilterRange")}
            </p>
          )}
        </div>
      </div>
      <FilterScrollHint scrollRef={scrollRef} />
      <div className="transaction-filter-footer bg-card">
        <button
          type="button"
          className={`${filterField} flex-1 hover:bg-track`}
          onClick={() => {
            setDraft({
              ...resetFilterDraft(),
              scope: config.defaultMonth ? "month" : applied.scope,
            });
            setDateRevision((value) => value + 1);
          }}
        >
          {t("resetFilters")}
        </button>
        <button
          type="submit"
          disabled={!valid}
          className="min-h-11 flex-1 rounded-[8px] bg-primary px-3 text-control font-semibold text-onprimary hover:brightness-95 disabled:opacity-50"
        >
          {t("applyFilters")}
        </button>
      </div>
    </form>
  );
}
