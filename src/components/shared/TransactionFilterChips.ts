import type { FilterDraft } from "@/lib/transactions/filter-draft";
import { emptyFilterDraft } from "@/lib/transactions/filter-draft";
import type { FilterConfig } from "./TransactionFilterEditor";

/** Derive chips and the badge from applied values, never from unsaved edits. */
export function transactionFilterChips(
  applied: FilterDraft,
  config: FilterConfig,
  labels: {
    category: string;
    payer: string;
    min: string;
    max: string;
    date: string;
    allDates?: string;
    sort: string;
    business: string;
    source: string;
  },
  onApply: (next: FilterDraft) => void,
) {
  const chips: { id: string; label: string; onClear: () => void }[] = [];
  const add = (id: string, label: string, patch: Partial<FilterDraft>) =>
    chips.push({ id, label, onClear: () => onApply({ ...applied, ...patch }) });
  for (const id of applied.categories)
    add(
      `category:${id}`,
      `${labels.category}: ${config.categories.find((o) => o.value === id)?.label ?? id}`,
      { categories: applied.categories.filter((c) => c !== id) },
    );
  if (applied.payer)
    add(
      "payer",
      `${labels.payer}: ${config.payers?.find((o) => o.value === applied.payer)?.label ?? applied.payer}`,
      { payer: "" },
    );
  if (applied.min) add("min", `${labels.min}: ${applied.min}`, { min: "" });
  if (applied.max) add("max", `${labels.max}: ${applied.max}`, { max: "" });
  if (applied.from || applied.to)
    add("dates", `${labels.date}: ${applied.from} – ${applied.to}`, {
      from: "",
      to: "",
      scope: config.defaultMonth ? "month" : applied.scope,
    });
  if (!applied.from && !applied.to && config.defaultMonth && applied.scope === "all")
    add("scope", labels.allDates ?? labels.date, { scope: "month" });
  if (applied.sort !== emptyFilterDraft.sort)
    add(
      "sort",
      `${labels.sort}: ${config.sorts.find((o) => o.value === applied.sort)?.label ?? applied.sort}`,
      { sort: emptyFilterDraft.sort },
    );
  if (applied.quick)
    add("quick", config.quick.find((o) => o.value === applied.quick)?.label ?? applied.quick, {
      quick: "",
    });
  if (applied.business !== "all")
    add(
      "business",
      `${labels.business}: ${config.businesses?.find((o) => o.value === applied.business)?.label ?? applied.business}`,
      { business: "all", period: "month" },
    );
  if (applied.source !== "all")
    add(
      "source",
      `${labels.source}: ${config.sources?.find((o) => o.value === applied.source)?.label ?? applied.source}`,
      { source: "all" },
    );
  return chips;
}
