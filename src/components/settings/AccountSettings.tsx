"use client";
import { IconAction } from "@/components/ui/IconAction";

import { LogoutAction } from "./LogoutAction";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { EditProfileForm } from "@/components/shared/EditProfileForm";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { VisualThemePicker } from "./VisualThemePicker";
import { SecurityPanel } from "./SecurityPanel";
import { NotificationSettings } from "./NotificationSettings";

/** Only account-wide controls belong here. Ledger configuration remains in
 * each ledger's Settings destination, reachable from its own navigation. */
export type AccountSection = "profile" | "appearance" | "security" | "notifications";

export function AccountSettings({ section }: { section?: AccountSection }) {
  const user = useStore((s) => s.user);
  const themePref = useStore((s) => s.themePref);
  const setThemePref = useStore((s) => s.setThemePref);
  const t = useTranslations("settingsPage");
  const [editing, setEditing] = useState(false);
  return (
    <div className="space-y-4 pt-3">
      {(!section || section === "profile") && (
        <section className="rounded-[14px] border border-edge bg-card p-4">
          {editing ? (
            <EditProfileForm onDone={() => setEditing(false)} />
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{user.name}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
              <IconAction
                action="edit"
                className="rounded-[10px] bg-primary text-onprimary"
                label={t("editProfile")}
                type="button"
                onClick={() => setEditing(true)}
              />
            </div>
          )}
        </section>
      )}
      {(!section || section === "security") && <SecurityPanel />}
      {(!section || section === "appearance") && (
        <section className="space-y-4 rounded-[14px] border border-edge bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium">{t("visualTheme.label")}</span>
            <VisualThemePicker />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium">{t("appearance")}</span>
            <div className="flex rounded-[10px] bg-track p-1">
              {(["system", "light", "dark"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={themePref === value}
                  onClick={() => setThemePref(value)}
                  className={`min-h-11 rounded-[7px] px-3 text-xs font-semibold ${themePref === value ? "bg-primary text-onprimary" : "text-muted"}`}
                >
                  {t(`theme.${value === "system" ? "auto" : value}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium">{t("language")}</span>
            <LanguageToggle />
          </div>
        </section>
      )}
      {(!section || section === "notifications") && <NotificationSettings />}
      {!section && <LogoutAction />}
    </div>
  );
}
