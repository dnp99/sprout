/** A saved Transactions view: a named, serialized filter set (plan 017 B2). */

/** The filter fields a view captures. All optional strings so an older/newer
 *  view degrades gracefully — unknown keys are dropped, missing keys default. */
export interface ViewFilters {
  type?: string;
  categoryId?: string;
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: string;
  amountMax?: string;
  sortKey?: string;
  sortDir?: string;
}

export interface SavedView {
  id: string;
  name: string;
  filters: ViewFilters;
}

const FILTER_KEYS = [
  "type",
  "categoryId",
  "query",
  "dateFrom",
  "dateTo",
  "amountMin",
  "amountMax",
  "sortKey",
  "sortDir",
] as const;

/** Keep only known string filter keys — ignores unknown/legacy keys and any
 *  non-string values, so persisted views can't inject arbitrary data. */
export function sanitizeFilters(raw: unknown): ViewFilters {
  const source = (raw ?? {}) as Record<string, unknown>;
  const out: ViewFilters = {};
  for (const key of FILTER_KEYS) {
    if (typeof source[key] === "string") out[key] = source[key] as string;
  }
  return out;
}
