"use client";
import { useState } from "react";
const empty = { filter: "all", query: "", payer: "", category: "" };

/** Opening All dates attention must reveal its records without overwriting the
 * search and filters the user will return to in their selected period. */
export function useSplitFilters(attention: boolean) {
  const scope = attention ? "attention" : "period";
  const [views, setViews] = useState({ period: empty, attention: empty });
  const patch = (value: Partial<typeof empty>) =>
    setViews((old) => ({ ...old, [scope]: { ...old[scope], ...value } }));
  return {
    ...views[scope],
    setFilter: (filter: string) => patch({ filter }),
    setQuery: (query: string) => patch({ query }),
    setPayer: (payer: string) => patch({ payer }),
    setCategory: (category: string) => patch({ category }),
    clear: () => patch(empty),
  };
}
