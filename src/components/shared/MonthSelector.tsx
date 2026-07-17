"use client";

import { Calendar, ChevronLeft, ChevronRight, Search } from "lucide-react";

type MonthSelectorIcon = "calendar" | "search" | "none";

/** Shared visual shell for every web/mobile month control. Domain wrappers own
 * which month is selected; this component owns consistent chrome, focus,
 * disabled states, and arrow sizing. Omit both callbacks for read-only context. */
export function MonthSelector({
  label,
  onPrevious,
  onNext,
  previousDisabled = false,
  nextDisabled = false,
  previousTitle,
  nextTitle,
  compact = false,
  icon = compact ? "none" : "calendar",
  muted = false,
  trailing,
  ariaLabel = "Month selector",
  className = "",
}: {
  label: string;
  onPrevious?: () => void;
  onNext?: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  previousTitle?: string;
  nextTitle?: string;
  compact?: boolean;
  icon?: MonthSelectorIcon;
  /** Muted surface communicates an intentionally disabled/all-dates scope. */
  muted?: boolean;
  trailing?: React.ReactNode;
  ariaLabel?: string;
  className?: string;
}) {
  const interactive = Boolean(onPrevious || onNext);
  const Icon = icon === "search" ? Search : Calendar;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex items-center rounded-[10px] border border-edge font-semibold ${
        compact ? "text-[11px]" : "text-[12.5px]"
      } ${muted ? "bg-track text-muted" : "bg-bg text-ink"} ${className}`}
    >
      {interactive && (
        <MonthArrow
          direction="previous"
          onClick={onPrevious}
          disabled={previousDisabled}
          title={previousTitle}
          compact={compact}
        />
      )}
      <span
        className={`flex items-center justify-center gap-[7px] whitespace-nowrap px-3 text-center tabular-nums ${
          compact ? "min-w-[104px]" : interactive ? "min-w-[132px]" : "h-10 min-w-[116px]"
        }`}
      >
        {icon !== "none" && <Icon size={14} strokeWidth={2} className="flex-none text-muted" />}
        {label}
      </span>
      {interactive && (
        <MonthArrow
          direction="next"
          onClick={onNext}
          disabled={nextDisabled}
          title={nextTitle}
          compact={compact}
        />
      )}
      {trailing}
    </div>
  );
}

function MonthArrow({
  direction,
  onClick,
  disabled,
  title,
  compact,
}: {
  direction: "previous" | "next";
  onClick?: () => void;
  disabled: boolean;
  title?: string;
  compact: boolean;
}) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      aria-label={direction === "previous" ? "Previous month" : "Next month"}
      title={disabled ? undefined : title}
      className={`flex flex-none items-center justify-center rounded-lg text-muted transition hover:bg-track hover:text-ink active:bg-track disabled:pointer-events-none disabled:opacity-30 ${
        compact ? "h-11 w-9" : "h-10 w-10"
      }`}
    >
      <Icon size={compact ? 18 : 16} strokeWidth={2.2} />
    </button>
  );
}
