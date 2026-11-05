"use client";

import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { VISUAL_THEMES } from "@/lib/appearance";

/** One palette selector shared by desktop and mobile; color mode stays independent. */
export function VisualThemePicker() {
  const theme = useStore((s) => s.visualTheme);
  const setTheme = useStore((s) => s.setVisualTheme);
  const t = useTranslations("settingsPage.visualTheme");
  return (
    <SegmentedControl
      value={theme}
      onChange={setTheme}
      label={t("label")}
      options={VISUAL_THEMES.map((value) => ({ value, label: t(value) }))}
      appearance="choices"
      shape="rounded"
      size="compact"
    />
  );
}
