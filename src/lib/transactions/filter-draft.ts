import { parseMoney } from "@/lib/import/amount";
import { MAX_CENTS } from "@/lib/groups/validation";

/** UI drafts contain decimal text; only validated integer cents cross adapters. */
export interface FilterDraft {
  scope: "month" | "all";
  categories: string[];
  payer: string;
  min: string;
  max: string;
  sort: string;
  from: string;
  to: string;
  quick: string;
  business: string;
  period: string;
  source: string;
}
export const emptyFilterDraft: FilterDraft = {
  scope: "all",
  categories: [],
  payer: "",
  min: "",
  max: "",
  sort: "date:desc",
  from: "",
  to: "",
  quick: "",
  business: "all",
  period: "month",
  source: "all",
};

/** Reject signs, exponent notation and excess precision rather than silently
 * rounding or turning negative input into an absolute value. */
export function filterAmount(raw: string, locale = "en-CA"): number | null {
  if (!raw.trim()) return null;
  const comma = locale === "fr-CA";
  if (!(comma ? /^\d+(?:,\d{1,2})?$/ : /^\d+(?:\.\d{1,2})?$/).test(raw.trim())) return null;
  const result = parseMoney(raw, comma ? "comma" : "period");
  return result.ok && result.cents <= MAX_CENTS ? result.cents : null;
}
/** Cross-field checks run before committing, so partial edits never change results. */
export function validFilterDraft(draft: FilterDraft, locale: string) {
  const min = filterAmount(draft.min, locale),
    max = filterAmount(draft.max, locale);
  return (
    (!draft.min.trim() || min !== null) &&
    (!draft.max.trim() || max !== null) &&
    (min === null || max === null || min <= max) &&
    (!draft.from || !draft.to || draft.from <= draft.to)
  );
}

/** Reset advanced controls without changing the primary kind, query or month. */
export function resetFilterDraft(): FilterDraft {
  return { ...emptyFilterDraft, categories: [] };
}
