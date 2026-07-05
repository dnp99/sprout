"use client";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"];

/** Numeric keypad used by the Add screen. `onPress` receives a digit, "." or
 *  "back". */
export function Keypad({ onPress }: { onPress: (key: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-0.5 text-center text-2xl font-bold text-ink">
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onPress(key)}
          className={`py-3.5 active:bg-track/60 ${key === "back" ? "text-subtle" : ""}`}
        >
          {key === "back" ? "⌫" : key}
        </button>
      ))}
    </div>
  );
}
