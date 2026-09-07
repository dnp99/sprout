"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/overlays";

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
  "📊",
  "📌",
  "📎",
  "🧑‍🍳",
  "🧑‍💻",
  "🧑‍🏫",
  "🧑‍⚕️",
  "🛠️",
  "📦",
  "📬",
  "🔑",
  "🪑",
  "🧺",
  "🪴",
  "🧼",
  "🧻",
  "🪥",
  "🚿",
  "🏋️",
  "🎧",
  "📷",
  "📖",
  "📰",
  "🎟️",
  "🎲",
  "🕹️",
  "🍿",
  "🛶",
  "⛺",
  "🎣",
  "🏥",
  "🪙",
  "💸",
  "🤝",
  "🚚",
  "🚇",
  "🚙",
  "🛵",
  "🔋",
  "📡",
  "🌐",
  "🧠",
  "🧪",
  "🐾",
  "🌼",
  "☀️",
  "❄️",
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
        compact ? "max-h-[128px] overflow-y-auto pr-1" : "max-h-[420px] overflow-y-auto pr-1"
      }
    >
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
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

/** Compact trigger for forms that should not expose a large picker inline.
 *  The palette lives in the same shared component as the category editor. */
export function EmojiIconPickerButton({
  value,
  onChange,
  title,
  ariaLabel,
}: {
  value: string;
  onChange: (emoji: string) => void;
  title: string;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);

  function choose(emoji: string) {
    onChange(emoji);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={ariaLabel}
        className="flex h-11 w-11 flex-none items-center justify-center rounded-[10px] border border-edge bg-track text-[19px] transition hover:border-primary"
      >
        {value}
      </button>
      {open && (
        <Modal title={title} onClose={() => setOpen(false)} width={680}>
          <div className="mt-4">
            <EmojiIconPicker value={value} onChange={choose} />
          </div>
        </Modal>
      )}
    </>
  );
}
