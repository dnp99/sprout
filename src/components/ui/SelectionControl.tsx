"use client";

import { useRef, type HTMLAttributes, type ReactNode } from "react";

export interface SelectionOption<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

/** Shared selection mechanics; callers retain domain behavior and surface geometry.
 * Tabs use one keyboard stop; pressed-button groups retain normal button semantics. */
export function SelectionControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className = "",
  buttonClassName,
  disabled = false,
  tabsId,
  ...props
}: Omit<HTMLAttributes<HTMLDivElement>, "onChange"> & {
  options: readonly SelectionOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  disabled?: boolean;
  tabsId?: string;
  buttonClassName: (active: boolean) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const keyboardValue =
    options.find((option) => option.value === value && !option.disabled)?.value ??
    options.find((option) => !option.disabled)?.value;
  return (
    <div
      {...props}
      ref={ref}
      role={tabsId ? "tablist" : "group"}
      aria-label={label}
      className={className}
      onKeyDown={(event) => {
        props.onKeyDown?.(event);
        if (event.defaultPrevented || disabled) return;
        const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
        if (!keys.includes(event.key)) return;
        const buttons = [
          ...(ref.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []),
        ];
        const focused = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const index =
          focused >= 0
            ? focused
            : Math.max(
                0,
                buttons.findIndex(
                  (button) =>
                    button.getAttribute("aria-selected") === "true" ||
                    button.getAttribute("aria-pressed") === "true",
                ),
              );
        if (!buttons.length) return;
        event.preventDefault();
        const rtl = getComputedStyle(ref.current!).direction === "rtl";
        const forward = (event.key === "ArrowRight") !== rtl;
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? buttons.length - 1
              : (index + (forward ? 1 : -1) + buttons.length) % buttons.length;
        buttons[next].focus({ preventScroll: true });
        buttons[next].click();
      }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled || option.disabled}
            role={tabsId ? "tab" : undefined}
            id={tabsId ? `${tabsId}-tab-${option.value}` : undefined}
            aria-controls={tabsId ? `${tabsId}-panel-${option.value}` : undefined}
            aria-selected={tabsId ? active : undefined}
            aria-pressed={tabsId ? undefined : active}
            tabIndex={tabsId ? (option.value === keyboardValue ? 0 : -1) : undefined}
            onClick={() => {
              if (!active || !tabsId) onChange(option.value);
            }}
            className={`selection-control-button min-h-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary motion-reduce:transition-none ${buttonClassName(active)}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
