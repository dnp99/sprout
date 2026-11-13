"use client";
import { useState } from "react";

/** Search is derived by the renderer. Only explicit user choices are stored;
 * selection changes clear conflicting collapses without undoing other choices. */
export function useCategoryDisclosure(
  selection: readonly string[],
  ancestorsFor: (id: string) => string[],
) {
  const activeId = selection.join("\u0000");
  const ancestors = [...new Set(selection.flatMap(ancestorsFor))];
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
    const previous = new Set(state.activeId.split("\u0000"));
    const previousAncestors = new Set(state.path.split("\u0000"));
    // Adding an unrelated selection must not reopen an explicitly collapsed
    // selected branch. Reveal only newly selected or newly loaded paths.
    const reveal = selection.filter((id) => !previous.has(id)).flatMap(ancestorsFor);
    ancestors.filter((id) => !previousAncestors.has(id)).forEach((id) => reveal.push(id));
    reveal.forEach((id) => collapsed.delete(id));
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
