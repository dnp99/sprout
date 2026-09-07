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
}: {
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  width?: number;
}) {
  const t = useTranslations("mobile");
  return (
    <div
      // The shared veil keeps lightweight editors visually consistent with
      // confirmation dialogs while preserving the page context underneath.
      className="modal-backdrop absolute inset-0 z-[80] flex items-center justify-center p-4"
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
        {children}
      </div>
    </div>
  );
}
