"use client";

import { Check } from "lucide-react";

/** A themed checkbox — a real (screen-reader-visible, keyboard-focusable) native
 *  input drives state, but the visible box is a styled span so it follows the
 *  light/dark tokens instead of the browser's default (which renders a bright
 *  white square in dark mode). Empty boxes keep an explicit themed boundary,
 *  including in palettes whose general hairline token is transparent. Checked = filled primary
 *  with a check, matching the design. */
export function Checkbox({
  checked,
  onChange,
  label,
  className = "",
  record = false,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  className?: string;
  record?: boolean;
  disabled?: boolean;
}) {
  return (
    <label
      data-record={record || undefined}
      className={`checkbox-control inline-flex cursor-pointer items-center ${className}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        aria-label={label}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="checkbox-indicator flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border-[1.5px] border-muted bg-card text-onprimary transition peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100"
      >
        <Check size={11} strokeWidth={3} />
      </span>
    </label>
  );
}
