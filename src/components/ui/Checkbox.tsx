"use client";

import { Check } from "lucide-react";

/** A themed checkbox — a real (screen-reader-visible, keyboard-focusable) native
 *  input drives state, but the visible box is a styled span so it follows the
 *  light/dark tokens instead of the browser's default (which renders a bright
 *  white square in dark mode). Empty = bordered square; checked = filled primary
 *  with a check, matching the design. */
export function Checkbox({
  checked,
  onChange,
  label,
  className = "",
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  className?: string;
}) {
  return (
    <label className={`inline-flex cursor-pointer items-center ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="peer sr-only"
      />
      <span className="flex h-4 w-4 items-center justify-center rounded-[4px] border-[1.5px] border-edge text-onprimary transition peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100">
        <Check size={11} strokeWidth={3} />
      </span>
    </label>
  );
}
