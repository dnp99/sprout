"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

const BATCH = 60;
// Only row counts are retained, never records or amounts. The bounded cache lets
// Back restore a long page without rebuilding every matching row on first paint.
const limits = new Map<string, number>();
/** IntersectionObserver appends rows near the end without a scroll handler;
 * a real button remains available to keyboards and unsupported browsers. */
export function MobileRecordList<T>({
  items,
  scope,
  renderItem,
}: {
  items: readonly T[];
  scope: string;
  renderItem: (item: T) => ReactNode;
}) {
  const t = useTranslations("txns");
  const [limit, setLimit] = useState(() => limits.get(scope) ?? BATCH);
  const more = useRef<HTMLButtonElement>(null);
  const hasMore = limit < items.length;
  useEffect(() => {
    limits.delete(scope);
    limits.set(scope, limit);
    if (limits.size > 12) limits.delete(limits.keys().next().value!);
  }, [scope, limit]);
  useEffect(() => {
    const button = more.current;
    if (!button || !hasMore || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setLimit((value) => value + BATCH);
      },
      { root: button.closest("[data-mobile-scroll]"), rootMargin: "0px 0px 400px 0px" },
    );
    observer.observe(button);
    return () => observer.disconnect();
  }, [hasMore, limit]);
  return (
    <>
      <div className="record-list record-list-connected mt-1 flex flex-col gap-1">
        {items.slice(0, limit).map(renderItem)}
      </div>
      {hasMore && (
        <button
          ref={more}
          type="button"
          onClick={() => setLimit((value) => value + BATCH)}
          className="mt-3 min-h-11 w-full rounded-[10px] border border-edge bg-card px-3 text-body font-medium text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          {t("loadMore")}
        </button>
      )}
    </>
  );
}
