"use client";

import { useState } from "react";

/** Cents entry uses a trailing focus cue because digits always fill from the right. */
export function AmountEntry({
  label,
  display,
  onKey,
  required = false,
  inputMode = "numeric",
  invalid = false,
  describedBy,
  onNext,
}: {
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
  inputMode?: "none" | "numeric";
  label: string;
  display: string;
  onKey: (key: string) => void;
  onNext?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <label className="relative inline-flex min-h-11 cursor-text items-center">
      <span>{display}</span>
      <span
        aria-hidden
        className={`ml-1 w-[3px] self-stretch rounded-full bg-current ${focused ? "animate-caret-blink" : "opacity-0"}`}
      />
      <input
        autoFocus
        data-initial-focus
        value={display}
        onChange={() => {}}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && onNext) {
            event.preventDefault();
            onNext();
          } else if (/^[0-9]$/.test(event.key)) {
            event.preventDefault();
            onKey(event.key);
          } else if (event.key === "Backspace" || event.key === "Delete") {
            event.preventDefault();
            onKey("back");
          }
        }}
        inputMode={inputMode}
        enterKeyHint={onNext ? "next" : undefined}
        aria-label={label}
        required={required}
        aria-required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="absolute inset-0 cursor-text opacity-0 outline-none"
      />
    </label>
  );
}
