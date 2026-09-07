"use client";

/** Curated, reusable emoji palette for user-owned budgeting entities.
 *  Keeping one picker prevents category, income, and business labels from
 *  drifting into different icon languages. */
export const EMOJI_ICON_OPTIONS = [
  "🏷️",
  "🌟",
  "🎉",
  "📱",
  "🏃",
  "🐶",
  "☕",
  "🎁",
  "🚕",
  "🩺",
  "📚",
  "🏠",
  "🛒",
  "🍔",
  "🍕",
  "🍜",
  "🍷",
  "🍰",
  "🥑",
  "🍺",
  "🚗",
  "⛽",
  "🚌",
  "✈️",
  "🚲",
  "🅿️",
  "💡",
  "🧾",
  "🛋️",
  "🧹",
  "🔧",
  "🌱",
  "🛍️",
  "👕",
  "🎮",
  "🎬",
  "🎵",
  "💻",
  "🎨",
  "⚽",
  "💰",
  "🏦",
  "🐷",
  "📈",
  "💳",
  "🎯",
  "🎓",
  "💼",
  "🐱",
  "🧸",
  "🍼",
  "🧘",
  "💇",
  "💊",
  "💪",
  "✂️",
  "🧳",
  "🏖️",
  "🗺️",
] as const;

export function EmojiIconPicker({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (emoji: string) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact ? "max-h-[128px] overflow-y-auto pr-1" : "max-h-[164px] overflow-y-auto pr-1"
      }
    >
      <div className="grid grid-cols-6 gap-2">
        {EMOJI_ICON_OPTIONS.map((icon) => (
          <button
            key={icon}
            type="button"
            aria-label={icon}
            aria-pressed={value === icon}
            onClick={() => onChange(icon)}
            className={`flex aspect-square items-center justify-center rounded-[12px] border-[1.5px] text-[20px] transition ${
              value === icon ? "border-primary bg-primary-soft" : "border-edge hover:border-muted"
            }`}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}
