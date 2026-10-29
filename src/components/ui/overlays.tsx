"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";

/** A centered modal (web) with a scrim that closes on backdrop click. */
export function Modal({
  onClose,
  title,
  subtitle,
  children,
  width = 400,
  fixed = false,
}: {
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  width?: number;
  /** Long import workspaces need a viewport overlay, independent of page scroll. */
  fixed?: boolean;
}) {
  const t = useTranslations("mobile");
  return (
    <div
      // The shared veil keeps lightweight editors visually consistent with
      // confirmation dialogs while preserving the page context underneath.
      className={`modal-backdrop ${fixed ? "fixed" : "absolute"} inset-0 z-[80] flex items-center justify-center p-4`}
      onClick={onClose}
    >
      <div
        role={fixed ? "dialog" : undefined}
        aria-modal={fixed ? true : undefined}
        aria-label={fixed && typeof title === "string" ? title : undefined}
        // Cap the height and scroll internally so tall content (e.g. the
        // category icon/color picker) stays usable on short viewports.
        className="flex max-h-[calc(100dvh-2rem)] min-h-0 w-full flex-col overflow-hidden rounded-[16px] border border-edge bg-card shadow-2xl"
        style={{ maxWidth: width }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between px-6 pt-4 pb-2">
          <div>
            <div className="text-[17px] font-bold text-ink">{title}</div>
            {subtitle && (
              <div className="mt-0.5 text-[12px] font-medium text-muted">{subtitle}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="-mr-2.5 flex h-11 w-11 flex-none items-center justify-center rounded-lg text-muted transition hover:bg-track/60 hover:text-ink"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        <div className="no-scrollbar min-h-0 overflow-y-auto overscroll-contain px-6 pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}
