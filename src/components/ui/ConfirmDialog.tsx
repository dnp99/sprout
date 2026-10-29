"use client";

import { useEffect, useId, useRef } from "react";

/** A centered confirmation popup (scrim + dialog) for destructive actions.
 *  Shared by every confirm flow — web and mobile — so the markup lives once.
 *  Sits above the edit modals/screens (z-[90], fixed). */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Keep it",
  busyLabel = "Deleting…",
  busy = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  busyLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop fixed inset-0 z-[90] flex items-center justify-center p-4"
      onClick={() => {
        if (!busy) onCancel();
      }}
      onKeyDown={(event) => {
        // A confirmation owns the keyboard while open; Escape must not close its editor too.
        event.stopPropagation();
        if (event.key === "Escape") {
          event.preventDefault();
          if (!busy) onCancel();
        }
        if (event.key === "Tab") {
          const buttons = Array.from(
            ref.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [],
          );
          const first = buttons[0],
            last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          } else if (!buttons.length) event.preventDefault();
        }
      }}
    >
      <div
        ref={ref}
        role="alertdialog"
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-[340px] rounded-3xl border border-edge bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div id={titleId} className="text-[17px] font-bold text-ink">
          {title}
        </div>
        {message && <div className="mt-2 text-[13.5px] font-semibold text-muted">{message}</div>}
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (!busy) onCancel();
            }}
            disabled={busy}
            className="min-h-11 flex-1 rounded-2xl border border-edge bg-card py-3 text-[13.5px] font-semibold text-muted disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-2xl bg-primary py-3 text-[13.5px] font-semibold text-onprimary disabled:opacity-50"
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
