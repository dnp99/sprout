"use client";

import { ChevronLeft } from "lucide-react";

/** Shared mobile headers. */

/** A back affordance with a ≥44px touch target (design system) — the chevron
 *  stays small but the hit area fills the row. The negative margin pulls the
 *  padded button back so the icon still aligns with the screen's left edge.
 *  Reused by every mobile back button so the tap target is consistent. */
export function BackButton({
  onClick,
  className = "",
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back"
      className={`-ml-2.5 flex h-11 w-11 flex-none items-center justify-center rounded-lg text-muted transition active:bg-track ${className}`}
    >
      <ChevronLeft size={24} strokeWidth={2} />
    </button>
  );
}

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
    <div className="flex items-center gap-1">
      {onBack && <BackButton onClick={onBack} />}
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
