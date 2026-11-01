"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

/** One logout treatment keeps account and ledger settings aligned in all palettes. */
export function LogoutAction() {
  const t = useTranslations("settingsPage");
  return (
    <a
      href="/logout"
      className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-edge px-4 text-[13px] font-semibold text-primary"
    >
      <LogOut size={16} strokeWidth={2} aria-hidden="true" />
      {t("logout")}
    </a>
  );
}
