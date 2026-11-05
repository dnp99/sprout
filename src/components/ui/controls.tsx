"use client";
import { SelectionControl } from "./SelectionControl";

/** Small shared controls: Toggle switch, SegmentedControl, and Chip. */

export function Toggle({
  on,
  onClick,
  activeColor,
  label,
}: {
  on: boolean;
  onClick: () => void;
  /** Optional custom "on" color (themed CSS var/hex). Defaults to the primary. */
  activeColor?: string;
  label: string;
}) {
  return (
    // Outer is a 44×44 tap target (design min); the visual track stays 26px,
    // vertically centered, so the switch looks unchanged but is easy to hit.
    <button
      type="button"
      onClick={onClick}
      role="switch"
      aria-checked={on}
      aria-label={label}
      className="inline-flex h-11 w-11 flex-none cursor-pointer items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span
        aria-hidden="true"
        className="relative block h-[26px] w-[44px] rounded-full transition-colors motion-reduce:transition-none"
        style={{
          background: on
            ? (activeColor ?? "var(--primary)")
            : "color-mix(in srgb, var(--muted) 55%, var(--card))",
          boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--fg) 25%, transparent)",
        }}
      >
        <span
          className={`absolute left-[3px] top-[3px] h-5 w-5 rounded-full shadow-sm transition-transform duration-150 motion-reduce:transition-none ${on ? "translate-x-[18px]" : "translate-x-0"}`}
          style={{ background: on ? "var(--add-fg)" : "var(--card)" }}
        />
      </span>
    </button>
  );
}

export interface SegOption<T extends string> {
  value: T;
  label: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  compact = false,
}: {
  options: SegOption<T>[];
  value: T;
  onChange: (value: T) => void;
  compact?: boolean;
}) {
  return (
    <SelectionControl
      options={options}
      value={value}
      onChange={onChange}
      className={`segmented-control flex gap-1 rounded-[12px] bg-track ${compact ? "p-[3px]" : "p-1"}`}
      buttonClassName={(active) =>
        `flex flex-1 items-center justify-center rounded-[9px] text-[13px] transition-colors ${active ? "bg-card font-semibold text-ink shadow-sm" : "font-medium text-muted"}`
      }
    />
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full px-3.5 text-[12.5px] transition ${
        active
          ? "bg-primary font-semibold text-onprimary"
          : "border border-edge font-medium text-ink hover:border-muted"
      }`}
    >
      {children}
    </button>
  );
}
