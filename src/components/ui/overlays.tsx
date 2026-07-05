"use client";

/** A bottom sheet (mobile) and a centered modal (web), sharing a scrim that
 *  closes on backdrop click. */

export function Sheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30" onClick={onClose}>
      <div
        className="w-full max-w-app rounded-t-[28px] bg-bg p-6 pb-8 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

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
      className="absolute inset-0 z-[80] flex items-center justify-center bg-ink/35 p-4"
      onClick={onClose}
    >
      <div
        className="w-full rounded-3xl bg-bg p-6 shadow-2xl"
        style={{ maxWidth: width }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="text-[17px] font-extrabold text-ink">{title}</span>
          <button type="button" onClick={onClose} className="text-xl text-muted">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
