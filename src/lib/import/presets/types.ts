import type { SproutCategoryKey } from "../category-map";
import type { ImportMapping } from "../types";

/** Supported import sources. A literal union (not `string`) so API/CLI callers
 *  are checked at compile time. */
export type PresetId = "monarch" | "ynab" | "goodbudget" | "mint";

/** A source preset: how to map its columns, which categories translate, and how
 *  to detect it from headers. `transformRow` is an optional escape hatch for
 *  source-specific normalization (used only when fixture semantics require it). */
export interface ImportPreset {
  id: PresetId;
  label: string;
  mapping: ImportMapping;
  categoryMap: Record<string, SproutCategoryKey>;
  detection: {
    /** All must be present (normalized) for the preset to be eligible. */
    requiredHeaders: readonly string[];
    /** Presence raises confidence; scoring picks the best eligible preset. */
    distinctiveHeaders: readonly string[];
    /** Secondary tie-breaker only. */
    filenameHints?: readonly string[];
  };
  transformRow?: (row: Record<string, string>) => Record<string, string>;
}
