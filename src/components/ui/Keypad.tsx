"use client";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"];

/** Numeric keypad used by the Add screen. `onPress` receives a digit, "." or
 *  "back". */
export function Keypad({ onPress }: { onPress: (key: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onPress(key)}
          aria-label={key === "back" ? "Delete last digit" : `Enter ${key}`}
          className={`flex h-14 items-center justify-center rounded-[18px] border border-edge bg-card text-2xl font-semibold transition active:bg-track/70 ${
            key === "back" ? "text-subtle" : "text-ink"
          }`}
        >
          {key === "back" ? "⌫" : key}
        </button>
      ))}
    </div>
  );
}
