"use client";
import { useState } from "react";

/** Search is derived by the renderer. Only explicit user choices are stored;
 * selection changes clear conflicting collapses without undoing other choices. */
export function useCategoryDisclosure(activeId: string, ancestors: string[]) {
  const path = ancestors.join("\u0000");
  const [state, setState] = useState(() => ({
    activeId,
    path,
    expanded: new Set<string>(),
    collapsed: new Set<string>(),
  }));
  let current = state;
  if (state.activeId !== activeId || state.path !== path) {
    const collapsed = new Set(state.collapsed);
    ancestors.forEach((id) => collapsed.delete(id));
    current = { ...state, activeId, path, collapsed };
    setState(current);
  }
  return {
    expanded: current.expanded,
    collapsed: current.collapsed,
    toggle(id: string, open: boolean) {
      setState((previous) => {
        const expanded = new Set(previous.expanded),
          collapsed = new Set(previous.collapsed);
        if (open) {
          expanded.delete(id);
          collapsed.add(id);
        } else {
          expanded.add(id);
          collapsed.delete(id);
        }
        return { ...previous, expanded, collapsed };
      });
    },
  };
}
