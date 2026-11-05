"use client";

import { useLayoutEffect, useRef } from "react";

/** Page routes share a viewport, unlike in-page tabs. Reset before paint so a
 * shorter destination never inherits the previous page's scroll offset. */
export function usePageScrollReset(page: string, enabled = true) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!enabled || !ref.current) return;
    const viewport = ref.current;
    // Bypass any global smooth-scroll preference: animating an old offset over
    // new content is precisely the visible jump this boundary prevents.
    const previous = viewport.style.scrollBehavior;
    viewport.style.scrollBehavior = "auto";
    viewport.scrollTop = 0;
    viewport.scrollLeft = 0;
    viewport.style.scrollBehavior = previous;
  }, [page, enabled]);
  return ref;
}
