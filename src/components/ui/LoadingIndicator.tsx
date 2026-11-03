"use client";

import { SkeletonRows } from "./Skeleton";
import { Sprout } from "lucide-react";
import { useTranslations } from "next-intl";

/** The mark inherits its context's ink, so it remains legible on buttons and cards. */
export function LoadingIndicator({
  size = 20,
  label,
  className = "",
}: {
  size?: number;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={`sprout-loading-indicator inline-flex shrink-0 items-center justify-center ${className}`}
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <Sprout size={size} strokeWidth={2} aria-hidden="true" />
    </span>
  );
}

/** A localized status for standalone page and section loading states. */
export function LoadingStatus({
  className = "",
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  const t = useTranslations("loadingIndicator");
  return (
    <LoadingIndicator size={size} label={t("label")} className={`text-primary ${className}`} />
  );
}

/** Authenticated data loads use quiet placeholders, avoiding a second logo
 * splash immediately after session startup. Navigation stays mounted. */
export function LoadingRegion() {
  return (
    <div className="flex min-h-[min(60svh,480px)] w-full flex-1 flex-col gap-3" data-loading-region>
      <div aria-hidden="true" className="flex h-11 items-center gap-3">
        <span className="skeleton-fill h-9 w-28 rounded-[10px]" />
        <span className="skeleton-fill h-9 flex-1 rounded-[10px]" />
      </div>
      <SkeletonRows rows={6} />
    </div>
  );
}
