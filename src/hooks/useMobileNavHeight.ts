"use client";

import { useEffect, useState } from "react";

/** Labels and safe-area insets can change the navigation height. Measure the
 * actual bar so the record dock never overlaps tabs, including after resizing. */
export function useMobileNavHeight() {
  const [bar, setBar] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const ledger = bar?.closest<HTMLElement>("[data-ledger-context]");
    if (!bar || !ledger) return;
    const update = () => {
      const height = bar.getBoundingClientRect().height;
      if (height > 0) ledger.style.setProperty("--mobile-nav-height", `${height}px`);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [bar]);
  return setBar;
}
