"use client";

import { SelectionControl } from "@/components/ui/SelectionControl";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { VISUAL_THEMES } from "@/lib/appearance";

/** One palette selector shared by desktop and mobile; color mode stays independent. */
export function VisualThemePicker() {
  const theme = useStore((s) => s.visualTheme);
  const setTheme = useStore((s) => s.setVisualTheme);
  const t = useTranslations("settingsPage.visualTheme");
  return (
    <SelectionControl
      value={theme}
      onChange={setTheme}
      label={t("label")}
      options={VISUAL_THEMES.map((value) => ({ value, label: t(value) }))}
      className="grid grid-cols-3 gap-2"
      buttonClassName={(active) =>
        `flex items-center justify-center rounded-[10px] border px-3 py-2 text-[12px] font-semibold transition-colors ${active ? "border-primary bg-primary text-onprimary" : "border-edge bg-card text-ink hover:border-primary"}`
      }
    />
  );
}
