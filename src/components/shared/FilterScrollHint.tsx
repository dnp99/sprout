"use client";
import { useLayoutEffect, useState, type RefObject } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

/** Native scrollbars may be hidden by the OS. Keep the continuation explicit,
 * including after conditional fields or the keyboard change available space. */
export function FilterScrollHint({
  scrollRef,
  label,
  actionable = false,
}: {
  scrollRef: RefObject<HTMLDivElement | null>;
  label?: string;
  actionable?: boolean;
}) {
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
  if (!moreBelow) return null;
  const content = (
    <>
      <span>{label ?? t("moreFiltersBelow")}</span>
      <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
    </>
  );
  const className =
    "transaction-filter-scroll-hint flex shrink-0 items-center justify-center gap-1.5 bg-card px-4 py-2 text-meta text-muted";
  return actionable ? (
    <button
      type="button"
      className={`${className} transaction-filter-category-more min-h-11 w-full border-t border-edge hover:bg-track`}
      onClick={() => {
        const region = scrollRef.current;
        if (region) region.scrollTop += Math.max(44, region.clientHeight - 44);
      }}
    >
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}
