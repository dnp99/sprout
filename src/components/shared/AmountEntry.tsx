"use client";

import { useState } from "react";

/** Cents entry uses a trailing focus cue because digits always fill from the right. */
export function AmountEntry({
  label,
  display,
  onKey,
}: {
  label: string;
  display: string;
  onKey: (key: string) => void;
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
        value={display}
        onChange={() => {}}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(event) => {
          if (/^[0-9]$/.test(event.key)) {
            event.preventDefault();
            onKey(event.key);
          } else if (event.key === "Backspace" || event.key === "Delete") {
            event.preventDefault();
            onKey("back");
          }
        }}
        inputMode="numeric"
        aria-label={label}
        className="absolute inset-0 cursor-text opacity-0 outline-none"
      />
    </label>
  );
}
