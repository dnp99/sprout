"use client";
import { useLayoutEffect, useState, type RefObject } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

/** Native scrollbars may be hidden by the OS. Keep the continuation explicit,
 * including after conditional fields or the keyboard change available space. */
export function FilterScrollHint({ scrollRef }: { scrollRef: RefObject<HTMLDivElement | null> }) {
  const t = useTranslations("txns");
  const [moreBelow, setMoreBelow] = useState(false);
  useLayoutEffect(() => {
    const region = scrollRef.current;
    if (!region) return;
    const measure = () =>
      setMoreBelow(region.scrollHeight - region.scrollTop - region.clientHeight > 2);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(region);
    // The inner content changes height when date presets/business options open;
    // observing only the bounded viewport would miss those changes.
    if (region.firstElementChild) observer?.observe(region.firstElementChild);
    measure();
    region.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      region.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [scrollRef]);
  return moreBelow ? (
    <div className="transaction-filter-scroll-hint flex shrink-0 items-center justify-center gap-1.5 bg-card px-4 py-2 text-meta text-muted">
      <span>{t("moreFiltersBelow")}</span>
      <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
    </div>
  ) : null;
}
