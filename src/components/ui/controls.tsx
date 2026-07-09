"use client";

/** Small shared controls: Toggle switch, SegmentedControl, and Chip. */

export function Toggle({
  on,
  onClick,
  activeColor,
}: {
  on: boolean;
  onClick: () => void;
  /** Optional custom "on" color (themed CSS var/hex). Defaults to the primary. */
  activeColor?: string;
}) {
  return (
    <span
      onClick={onClick}
      role="switch"
      aria-checked={on}
      className={`relative inline-block h-[26px] w-[44px] flex-none cursor-pointer rounded-full transition-colors ${
        on ? (activeColor ? "" : "bg-primary") : "bg-track"
      }`}
      style={on && activeColor ? { background: activeColor } : undefined}
    >
      <span
        className="absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-sm transition-all"
        style={on ? { right: 3 } : { left: 3 }}
      />
    </span>
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
}: {
  options: SegOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-[12px] bg-track p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex-1 rounded-[9px] py-2 text-[13px] transition ${
              active ? "bg-card font-semibold text-ink shadow-sm" : "font-medium text-muted"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
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
      className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-[12.5px] transition ${
        active
          ? "bg-primary font-semibold text-onprimary"
          : "border border-edge font-medium text-ink hover:border-muted"
      }`}
    >
      {children}
    </button>
  );
}
