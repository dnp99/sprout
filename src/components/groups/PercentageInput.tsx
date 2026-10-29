import type { InputHTMLAttributes } from "react";
import { inputClass } from "./ui";

/** Keep the unit visible while editing without including it in the numeric value. */
export function PercentageInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span className={`relative block min-w-0 ${className}`}>
      <input {...props} inputMode="decimal" className={`${inputClass} pr-9 tabular-nums`} />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
      >
        %
      </span>
    </span>
  );
}
