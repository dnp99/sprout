"use client";

import { useEffect, useState } from "react";

/** Labels and safe-area insets can change the navigation height. Measure the
 * actual bar so the record dock never overlaps tabs, including after resizing.
 * The pager and dock reuse this measurement with their own height property. */
export function useMobileNavHeight(property = "--mobile-nav-height") {
  const [bar, setBar] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const ledger = bar?.closest<HTMLElement>("[data-ledger-context]");
    if (!bar || !ledger) return;
    const update = () => {
      const height = bar.getBoundingClientRect().height;
      if (height > 0) ledger.style.setProperty(property, `${height}px`);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    return () => {
      observer.disconnect();
      ledger.style.removeProperty(property);
    };
  }, [bar, property]);
  return setBar;
}
