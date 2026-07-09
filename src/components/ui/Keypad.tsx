"use client";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"];

/** Numeric keypad used by the Add screen. `onPress` receives a digit, "." or
 *  "back". */
export function Keypad({
  onPress,
  compact = false,
}: {
  onPress: (key: string) => void;
  compact?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onPress(key)}
          aria-label={key === "back" ? "Delete last digit" : `Enter ${key}`}
          className={`flex items-center justify-center border border-edge bg-card font-semibold transition active:bg-track/70 ${
            compact ? "h-12 rounded-[14px] text-xl" : "h-14 rounded-[18px] text-2xl"
          } ${key === "back" ? "text-subtle" : "text-ink"}`}
        >
          {key === "back" ? "⌫" : key}
        </button>
      ))}
    </div>
  );
}
