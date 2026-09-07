"use client";

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
  return (
    <div
      className="modal-backdrop fixed inset-0 z-[90] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[340px] rounded-3xl border border-edge bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[17px] font-extrabold text-ink">{title}</div>
        {message && <div className="mt-2 text-[13.5px] font-semibold text-muted">{message}</div>}
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-2xl bg-card py-3 text-[13.5px] font-extrabold text-muted disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-2xl bg-primary-dark py-3 text-[13.5px] font-extrabold text-white disabled:opacity-50"
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
