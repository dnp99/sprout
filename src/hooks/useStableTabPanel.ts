"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Measure the nearest real scroll viewport, intersected with the visible
 * browser viewport, so nested panels and an open mobile keyboard stay bounded. */
export function useStableTabPanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const reserved = useRef(false);
  const [minHeight, setMinHeight] = useState<number>();
  const measure = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    let parent = panel.parentElement;
    while (
      parent &&
      (parent === document.body ||
        parent === document.documentElement ||
        !/(auto|scroll)/.test(getComputedStyle(parent).overflowY))
    )
      parent = parent.parentElement;
    const viewport = window.visualViewport;
    const viewportBottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
    const bottom = parent
      ? Math.min(
          viewportBottom,
          parent.getBoundingClientRect().top + parent.clientTop + parent.clientHeight,
        )
      : viewportBottom;
    // Do not reserve offscreen history when the panel starts above the viewport.
    setMinHeight(
      Math.max(
        0,
        Math.ceil(bottom - Math.max(panel.getBoundingClientRect().top, viewport?.offsetTop ?? 0)),
      ),
    );
  }, []);
  const prepareSwitch = useCallback(() => {
    reserved.current = true;
    measure();
  }, [measure]);
  useEffect(() => {
    const resize = () => {
      if (reserved.current) measure();
    };
    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("scroll", resize);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    let parent = panelRef.current?.parentElement;
    while (parent) {
      observer?.observe(parent);
      parent = parent.parentElement;
    }
    return () => {
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("scroll", resize);
      observer?.disconnect();
    };
  }, [measure]);
  return { panelRef, minHeight, prepareSwitch };
}
