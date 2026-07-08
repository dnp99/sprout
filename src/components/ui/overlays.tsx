"use client";

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
