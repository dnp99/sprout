"use client";

import { LoadingStatus } from "./LoadingIndicator";

/** Section loads share the same theme-aware mark as full-page loads. */
export function SkeletonRows({ className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`flex min-h-16 items-center justify-center ${className}`}>
      <LoadingStatus />
    </div>
  );
}
