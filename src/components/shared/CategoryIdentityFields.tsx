"use client";
import { CATEGORY_NAME_MAX_LENGTH } from "@/lib/categories/validation";
import { useTranslations } from "next-intl";
import { EmojiIconPickerButton } from "./EmojiIconPicker";
import { Field, inputClass } from "@/components/groups/ui";

/** Personal and group editors share identity controls while keeping ledger data independent. */
export function CategoryIdentityFields({
  name,
  emoji,
  color,
  onName,
  onEmoji,
  onColor,
  disabled,
}: {
  name: string;
  emoji: string;
  color: string;
  onName: (value: string) => void;
  onEmoji: (value: string) => void;
  onColor: (value: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("groups");
  return (
    <fieldset disabled={disabled} className="space-y-4">
      <Field label={t("name")}>
        <input
          required
          maxLength={CATEGORY_NAME_MAX_LENGTH}
          value={name}
          onChange={(e) => onName(e.target.value)}
          className={inputClass}
        />
      </Field>
      <div className="flex items-center gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted">{t("icon")}</p>
          <EmojiIconPickerButton
            value={emoji}
            onChange={onEmoji}
            title={t("icon")}
            ariaLabel={t("icon")}
            color={color}
            round
          />
        </div>
        <label className="space-y-1 text-xs text-muted">
          <span className="block">{t("color")}</span>
          <input
            aria-label={t("color")}
            type="color"
            value={color}
            onChange={(e) => onColor(e.target.value)}
            className="h-11 w-14 cursor-pointer rounded-[10px] border border-edge bg-card p-1"
          />
        </label>
      </div>
    </fieldset>
  );
}
