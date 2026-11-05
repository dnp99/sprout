"use client";
import { useTranslations } from "next-intl";
import { Toggle } from "@/components/ui/controls";
import { useStore } from "@/state/store";

export function EditedHighlightSetting() {
  const t = useTranslations("groups");
  const enabled = useStore((s) => s.editedHighlight);
  const setEnabled = useStore((s) => s.setEditedHighlight);
  return (
    <div className="my-3 flex min-h-11 items-center justify-between gap-4 text-sm">
      <span>
        <span className="font-medium">{t("editedHighlightSetting")}</span>
        <span className="mt-1 block text-xs text-muted">{t("editedHighlightHint")}</span>
      </span>
      <Toggle
        on={enabled}
        onClick={() => setEnabled(!enabled)}
        label={t("editedHighlightSetting")}
      />
    </div>
  );
}
