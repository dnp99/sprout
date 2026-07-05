"use client";

/** Shared mobile headers. */

/** Back-chevron + title, with an optional right-side action. */
export function ScreenHeader({
  title,
  onBack,
  right,
}: {
  title: React.ReactNode;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="-mt-[3px] text-[28px] leading-none text-muted"
        >
          ‹
        </button>
      )}
      <span className="text-[22px] font-extrabold text-ink">{title}</span>
      {right && <span className="ml-auto">{right}</span>}
    </div>
  );
}

/** Cancel · title · Save row used by the create/edit screens. */
export function CancelSaveHeader({
  title,
  onCancel,
  onSave,
  saveLabel = "Save",
}: {
  title: React.ReactNode;
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <button type="button" onClick={onCancel} className="text-sm font-semibold text-muted">
        Cancel
      </button>
      <span className="text-[15px] font-extrabold text-ink">{title}</span>
      <button type="button" onClick={onSave} className="text-sm font-extrabold text-primary">
        {saveLabel}
      </button>
    </div>
  );
}

/** Section title with an optional right-aligned action link. */
export function SectionHeader({
  title,
  action,
  onAction,
  className,
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between ${className ?? ""}`}>
      <h2 className="text-base font-extrabold text-ink">{title}</h2>
      {action && (
        <button type="button" onClick={onAction} className="text-xs font-bold text-primary">
          {action}
        </button>
      )}
    </div>
  );
}
