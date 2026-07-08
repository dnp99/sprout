"use client";

import { X } from "lucide-react";

/** A centered modal (web) with a scrim that closes on backdrop click. */
export function Modal({
  onClose,
  title,
  children,
  width = 400,
}: {
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  width?: number;
}) {
  return (
    <div
      // Fixed dark scrim (theme-independent) so it reads correctly over both the
      // light and dark app surfaces.
      className="absolute inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full rounded-[16px] border border-edge bg-card p-6 shadow-2xl"
        style={{ maxWidth: width }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="text-[17px] font-bold text-ink">{title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted transition hover:text-ink"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
