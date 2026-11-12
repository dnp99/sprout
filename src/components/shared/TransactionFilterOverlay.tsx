"use client";
import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDesktop } from "@/hooks/useDesktop";
import { useModalFocus } from "@/hooks/useModalFocus";

/** Reuses the app's modal focus/scroll/back boundary. Select portals target the
 * dialog itself, so nested choices belong to its outside-click boundary. */
export function TransactionFilterOverlay({
  anchor,
  onClose,
  children,
}: {
  anchor: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  children: ReactNode;
}) {
  const t = useTranslations("txns");
  const desktop = useDesktop();
  const ref = useRef<HTMLDivElement>(null);
  const [geometry, setGeometry] = useState({ left: 12, top: 12, maxHeight: 600 });
  useModalFocus(ref, onClose, !desktop);
  useLayoutEffect(() => {
    const position = () => {
      const rect = anchor.current?.getBoundingClientRect();
      if (!rect) return;
      const top = Math.min(rect.bottom + 8, Math.max(12, window.innerHeight - 320));
      setGeometry({
        left: Math.max(12, Math.min(rect.right - 400, window.innerWidth - 412)),
        top,
        maxHeight: Math.max(180, window.innerHeight - top - 12),
      });
    };
    position();
    window.addEventListener("resize", position);
    document.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      document.removeEventListener("scroll", position, true);
    };
  }, [anchor]);
  const context =
    anchor.current?.closest<HTMLElement>("[data-ledger-context]")?.dataset.ledgerContext;
  return createPortal(
    <div
      data-ledger-context={context}
      className={`transaction-filter-overlay ${desktop ? "is-desktop" : "is-mobile modal-backdrop"}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={t("filters")}
        className="transaction-filter-dialog rounded-[14px] border border-edge bg-card text-ink shadow-2xl"
        style={desktop ? { position: "fixed", width: 400, ...geometry } : undefined}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-edge px-4 py-2">
          <h2 className="text-body font-semibold">
            {desktop ? t("filters") : t("filterTransactions")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="flex h-11 w-11 items-center justify-center rounded-[8px] text-muted hover:bg-track"
          >
            <X size={17} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
