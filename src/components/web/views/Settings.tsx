"use client";

import { ConnectedApps } from "@/components/settings/ConnectedApps";
import { EditProfileForm } from "@/components/shared/EditProfileForm";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { Modal } from "@/components/ui/overlays";
import { useFormatters } from "@/i18n/useFormatters";
import { useStore } from "@/state/store";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  CircleDollarSign,
  Globe,
  Languages,
  Palette,
  ChevronRight,
  Monitor,
  Sun,
  Moon,
} from "lucide-react";

export function Settings() {
  const { user, themePref, setThemePref, set } = useStore(
    useShallow((s) => ({
      user: s.user,
      themePref: s.themePref,
      setThemePref: s.setThemePref,
      set: s.set,
    })),
  );
  const router = useRouter();
  const t = useTranslations("settingsPage");
  const fmt = useFormatters();
  const [editing, setEditing] = useState(false);

  return (
    <>
      {editing && (
        <Modal title={t("editProfileModal")} onClose={() => setEditing(false)}>
          <div className="mt-4">
            <EditProfileForm onDone={() => setEditing(false)} />
          </div>
        </Modal>
      )}

      <div className="mt-4 space-y-[18px]">
        <div className="grid grid-cols-1 gap-[18px] xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)]">
          <Panel className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-[14px]">
                <span className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-full bg-primary text-[19px] font-bold text-onprimary">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[18px] font-bold text-ink">{user.name}</div>
                  <div className="truncate text-[12.5px] font-medium text-muted">{user.email}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex-none rounded-[10px] bg-primary px-3.5 py-2 text-[12.5px] font-semibold text-onprimary"
              >
                {t("editProfile")}
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <AccountAction
                label={t("importExport")}
                description={t("importExportDesc")}
                onClick={() => set({ webView: "import" })}
              />
              <AccountAction
                label={t("logout")}
                description={t("logoutDesc")}
                onClick={() => router.push("/logout")}
              />
            </div>
          </Panel>

          <ConnectedApps />
        </div>

        <div className="grid items-start gap-[18px] xl:grid-cols-2">
          <Panel title={t("preferences")}>
            <IconRow
              icon={<CircleDollarSign size={15} strokeWidth={2} />}
              label={t("monthlyBudget")}
              onClick={() => set({ webEditBudgetOpen: true })}
            >
              <div className="flex items-center gap-1">
                <span className="text-[13px] font-semibold text-muted">
                  {fmt.money(user.budgetPoolCents)}
                </span>
                <ChevronRight size={14} strokeWidth={2} className="text-muted" />
              </div>
            </IconRow>
            <IconRow icon={<CircleDollarSign size={15} strokeWidth={2} />} label={t("currency")}>
              <span className="text-[13px] font-semibold text-muted">CAD $</span>
            </IconRow>
            <IconRow icon={<Globe size={15} strokeWidth={2} />} label={t("budgetCycle")}>
              <span className="text-[13px] font-semibold capitalize text-muted">
                {t(`cycle.${user.budgetCycle}`)}
              </span>
            </IconRow>
            <IconRow icon={<Palette size={15} strokeWidth={2} />} label={t("appearance")}>
              <AppearanceToggle pref={themePref} setPref={setThemePref} />
            </IconRow>
            <IconRow icon={<Languages size={15} strokeWidth={2} />} label={t("language")}>
              <LanguageToggle />
            </IconRow>
          </Panel>

          <Panel title={t("comingSoon")}>
            <div className="grid gap-4 py-2 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <ComingSoonCard title={t("notifications")} description={t("notificationsDesc")} />
              <ComingSoonCard title={t("security")} description={t("securityDesc")} />
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Panel({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`h-max rounded-[14px] border border-edge px-[18px] py-1.5 ${className}`.trim()}>
      {title ? (
        <div className="pb-0.5 pt-3.5 text-[11px] font-bold uppercase tracking-[0.05em] text-muted">
          {title}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function AccountAction({
  label,
  description,
  onClick,
}: {
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[12px] border border-edge bg-card px-4 py-3 text-left transition hover:border-soft-border"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13.5px] font-semibold text-ink">{label}</span>
        <ChevronRight size={14} strokeWidth={2} className="text-muted" />
      </div>
      <div className="mt-1 text-[12px] font-medium text-muted">{description}</div>
    </button>
  );
}

/** Preference row with a leading icon tile, label, and trailing control/value. */
function IconRow({
  icon,
  label,
  children,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] bg-track text-muted">
        {icon}
      </span>
      <span className="flex-1 text-[13.5px] font-semibold text-ink">{label}</span>
      {children}
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 py-[13px] text-left"
      >
        {content}
      </button>
    );
  }
  return <div className="flex items-center gap-3 py-[13px]">{content}</div>;
}

type ThemePref = "system" | "light" | "dark";

const THEME_OPTIONS: { value: ThemePref; icon: React.ReactNode }[] = [
  { value: "system", icon: <Monitor size={14} strokeWidth={2} /> },
  { value: "light", icon: <Sun size={14} strokeWidth={2} /> },
  { value: "dark", icon: <Moon size={14} strokeWidth={2} /> },
];

/** System/Light/Dark segmented control wired to the store's theme preference.
 *  "System" (the default) follows the device's color scheme. */
function AppearanceToggle({
  pref,
  setPref,
}: {
  pref: ThemePref;
  setPref: (pref: ThemePref) => void;
}) {
  const t = useTranslations("settingsPage.theme");
  return (
    <div className="flex gap-1 rounded-[10px] bg-track p-1">
      {THEME_OPTIONS.map((option) => {
        const active = option.value === pref;
        const label = t(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-label={t("aria", { label })}
            aria-pressed={active}
            onClick={() => setPref(option.value)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-semibold transition ${
              active ? "bg-card text-ink shadow-sm" : "text-muted"
            }`}
          >
            {option.icon}
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** Placeholder body for a settings panel that isn't built yet. */
function ComingSoonCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[12px] border border-edge bg-card px-4 py-3.5">
      <div className="text-[13px] font-semibold text-ink">{title}</div>
      <p className="mt-2 text-[12.5px] font-medium leading-relaxed text-muted">{description}</p>
    </div>
  );
}
