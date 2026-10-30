"use client";

import { useRef } from "react";
import { useModalFocus } from "@/hooks/useModalFocus";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

/** A centered modal (web) with a scrim that closes on backdrop click. */
export function Modal({
  onClose,
  title,
  subtitle,
  children,
  width = 400,
  fixed = true,
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
  const ref = useRef<HTMLDivElement>(null);
  useModalFocus(ref, onClose);
  return (
    <div
      // The shared veil keeps lightweight editors visually consistent with
      // confirmation dialogs while preserving the page context underneath.
      className={`modal-backdrop ${fixed ? "fixed inset-x-0" : "absolute inset-0"} z-[80] flex items-center justify-center`}
      style={{
        ...(fixed
          ? { top: "var(--app-viewport-top, 0px)", height: "var(--app-viewport-height, 100dvh)" }
          : {}),
        paddingTop: "max(1rem, env(safe-area-inset-top))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
      onClick={onClose}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        // Cap the height and scroll internally so tall content (e.g. the
        // category icon/color picker) stays usable on short viewports.
        className="flex max-h-[calc(var(--app-viewport-height,100dvh)-max(1rem,env(safe-area-inset-top))-max(1rem,env(safe-area-inset-bottom)))] min-h-0 w-full flex-col overflow-hidden rounded-[16px] border border-edge bg-card shadow-2xl"
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
