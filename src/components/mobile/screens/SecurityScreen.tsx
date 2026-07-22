"use client";

import { SecurityPanel } from "@/components/settings/SecurityPanel";
import { ScreenHeader } from "@/components/ui/headers";
import { useStore } from "@/state/store";
import { useTranslations } from "next-intl";

/** Mobile Settings → Security. Thin wrapper (back header) around the shared
 *  Security panel (change password, sign out other devices, delete account). */
export function SecurityScreen() {
  const goMobile = useStore((s) => s.goMobile);
  const t = useTranslations("settingsPage.securityPanel");
  return (
    <div className="px-4 pb-4 pt-1">
      <ScreenHeader title={t("title")} onBack={() => goMobile("settings")} />
      <div className="mt-4">
        <SecurityPanel />
      </div>
    </div>
  );
}
