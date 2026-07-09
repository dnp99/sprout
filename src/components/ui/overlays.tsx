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
        // Cap the height and scroll internally so tall content (e.g. the
        // category icon/color picker) stays usable on short viewports.
        className="max-h-[calc(100vh-2rem)] w-full overflow-y-auto rounded-[16px] border border-edge bg-card p-6 shadow-2xl"
        style={{ maxWidth: width }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="text-[17px] font-bold text-ink">{title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1.5 flex h-9 w-9 flex-none items-center justify-center rounded-lg text-muted transition hover:bg-track/60 hover:text-ink"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
