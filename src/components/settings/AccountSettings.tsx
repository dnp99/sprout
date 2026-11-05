"use client";
import { SelectionControl } from "@/components/ui/SelectionControl";
import { IconAction } from "@/components/ui/IconAction";

import { LogoutAction } from "./LogoutAction";
import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { accountSections, type AccountSection } from "./account-sections";
export type { AccountSection } from "./account-sections";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { EditProfileForm } from "@/components/shared/EditProfileForm";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { VisualThemePicker } from "./VisualThemePicker";
import { SecurityPanel } from "./SecurityPanel";
import { NotificationSettings } from "./NotificationSettings";

/** Only account-wide controls belong here. Ledger configuration remains in
 * each ledger's Settings destination, reachable from its own navigation. */
/** One content instance per section preserves form drafts when navigating.
 * Responsive visibility gives phones disclosures and desktop a stable side rail. */
export function AccountSettings({ section = "profile" }: { section?: AccountSection }) {
  const t = useTranslations("settingsPage");
  const id = useId();
  const [active, setActive] = useState<AccountSection>(section);
  const [expanded, setExpanded] = useState<AccountSection | null>(section);
  return (
    <div className="pt-2 lg:grid lg:min-h-[360px] lg:grid-cols-[160px_minmax(0,1fr)] lg:gap-5">
      <nav
        aria-label={t("account")}
        className="hidden space-y-1 border-r border-edge pr-4 lg:block"
      >
        {accountSections.map(({ id: key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            aria-current={active === key ? "page" : undefined}
            aria-controls={`${id}-${key}`}
            onClick={() => setActive(key)}
            className={`flex min-h-11 w-full items-center gap-2 rounded-[10px] px-3 text-left text-body font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${active === key ? "bg-primary-soft text-ink" : "text-muted hover:bg-track"}`}
          >
            <Icon size={16} strokeWidth={2} />
            {t(label)}
          </button>
        ))}
        <div className="border-t border-edge pt-3">
          <LogoutAction />
        </div>
      </nav>
      <div className="min-w-0 space-y-3 lg:space-y-0">
        {accountSections.map(({ id: key, label, icon: Icon }) => (
          <section
            key={key}
            className={`rounded-[14px] border border-edge lg:rounded-none lg:border-0 ${active === key ? "lg:block" : "lg:hidden"}`}
          >
            <button
              type="button"
              aria-expanded={expanded === key}
              aria-controls={`${id}-${key}`}
              onClick={() => setExpanded(expanded === key ? null : key)}
              className="account-section-trigger flex min-h-11 w-full items-center gap-2 px-4 py-3 text-left text-body font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary lg:hidden"
            >
              <Icon size={16} strokeWidth={2} />
              <span className="flex-1">{t(label)}</span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 motion-reduce:transition-none ${expanded === key ? "rotate-180" : ""}`}
              />
            </button>
            <div
              id={`${id}-${key}`}
              className="account-section-panel"
              data-expanded={expanded === key}
            >
              <div className="min-h-0 overflow-hidden">
                <h2 className="mb-3 hidden text-[15px] font-semibold text-ink lg:block">
                  {t(label)}
                </h2>
                <AccountSectionContent section={key} />
              </div>
            </div>
          </section>
        ))}
        <div className="pt-2 lg:hidden">
          <LogoutAction />
        </div>
      </div>
    </div>
  );
}

function AccountSectionContent({ section }: { section: AccountSection }) {
  const user = useStore((s) => s.user);
  const themePref = useStore((s) => s.themePref);
  const setThemePref = useStore((s) => s.setThemePref);
  const t = useTranslations("settingsPage");
  const [editing, setEditing] = useState(false);
  return (
    <div className="space-y-4">
      {section === "profile" && (
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
      {section === "security" && <SecurityPanel />}
      {section === "appearance" && (
        <section className="space-y-4 rounded-[14px] border border-edge bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium">{t("visualTheme.label")}</span>
            <VisualThemePicker />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium">{t("appearance")}</span>
            <SelectionControl
              label={t("appearance")}
              value={themePref}
              onChange={setThemePref}
              options={(["system", "light", "dark"] as const).map((value) => ({
                value,
                label: t(`theme.${value === "system" ? "auto" : value}`),
              }))}
              className="flex rounded-[10px] bg-track p-1"
              buttonClassName={(active) =>
                `rounded-[7px] px-3 text-xs font-semibold ${active ? "bg-primary text-onprimary" : "text-muted"}`
              }
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium">{t("language")}</span>
            <LanguageToggle />
          </div>
        </section>
      )}
      {section === "notifications" && <NotificationSettings />}
    </div>
  );
}
