"use client";

import { RulesPanel } from "@/components/settings/RulesPanel";
import { ScreenHeader } from "@/components/ui/headers";
import { useStore } from "@/state/store";
import { useTranslations } from "next-intl";

/** Mobile Settings → Rules. Thin wrapper (back header) around the shared rules
 *  manager (view / add / edit / delete merchant→category rules). */
export function RulesScreen() {
  const goMobile = useStore((s) => s.goMobile);
  const t = useTranslations("settingsPage.rulesPanel");
  return (
    <div className="px-4 pb-4 pt-1">
      <ScreenHeader title={t("title")} onBack={() => goMobile("settings")} />
      <div className="mt-4">
        <RulesPanel />
      </div>
    </div>
  );
}
