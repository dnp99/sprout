"use client";

import { useTranslations } from "next-intl";
import { PersonalSettings } from "@/components/settings/PersonalSettings";

/** The bottom Settings destination configures this ledger; account preferences
 * are available from the avatar above the context switch on every main screen. */
export function Settings() {
  const t = useTranslations("nav");
  return (
    <div className="space-y-4 px-4 pb-4">
      <h1 className="text-[20px] font-bold text-ink">{t("settings")}</h1>
      <PersonalSettings mobile />
    </div>
  );
}
