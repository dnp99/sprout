"use client";

import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import type { VisualTheme } from "@/lib/appearance";

/** One palette selector shared by desktop and mobile; color mode stays independent. */
export function VisualThemePicker() {
  const theme = useStore((s) => s.visualTheme);
  const setTheme = useStore((s) => s.setVisualTheme);
  const t = useTranslations("settingsPage.visualTheme");
  return (
    <div role="group" aria-label={t("label")} className="grid grid-cols-2 gap-2">
      {(["vibrant", "cozy"] as VisualTheme[]).map((value) => (
        <button
          type="button"
          key={value}
          aria-pressed={theme === value}
          onClick={() => setTheme(value)}
          className={`flex min-h-11 items-center justify-center rounded-[10px] border px-3 py-2 text-[12px] font-semibold transition ${theme === value ? "border-primary bg-primary text-onprimary" : "border-edge bg-card text-ink hover:border-primary"}`}
        >
          {t(value)}
        </button>
      ))}
    </div>
  );
}
