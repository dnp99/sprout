"use client";
import { useState, type SetStateAction } from "react";

/** Changing businesses must not carry hidden selections into a later bulk mutation. */
export function useScopedSelection(scope: string) {
  const [selection, setSelection] = useState({ scope, ids: new Set<string>() });
  const selected = selection.scope === scope ? selection.ids : new Set<string>();
  // Forget the previous scope permanently, including when the user switches back.
  if (selection.scope !== scope) setSelection({ scope, ids: new Set<string>() });
  const setSelected = (value: SetStateAction<Set<string>>) =>
    setSelection((previous) => ({
      scope,
      ids:
        typeof value === "function"
          ? value(previous.scope === scope ? previous.ids : new Set<string>())
          : value,
    }));
  return [selected, setSelected] as const;
}
