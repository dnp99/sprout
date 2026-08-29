"use client";

import {
  Bell,
  ChevronRight,
  CircleDollarSign,
  FolderInput,
  Globe,
  KeyRound,
  Languages,
  Monitor,
  Moon,
  Shield,
  Sun,
  Tags,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EditProfileForm } from "@/components/shared/EditProfileForm";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { PwaInstallCard } from "@/components/settings/PwaInstallCard";
import { BackButton, ScreenHeader } from "@/components/ui/headers";
import { useFormatters } from "@/i18n/useFormatters";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "next-intl";

export function Settings() {
  const { user, goMobile, theme, themePref, setThemePref } = useStore(
    useShallow((s) => ({
      user: s.user,
      goMobile: s.goMobile,
      theme: s.theme,
      themePref: s.themePref,
      setThemePref: s.setThemePref,
    })),
  );
  const router = useRouter();
  const t = useTranslations("settingsPage");
  const fmt = useFormatters();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="px-4 pt-3">
        <ScreenHeader title={t("editProfile")} onBack={() => setEditing(false)} />
        <div className="mt-5">
          <EditProfileForm onDone={() => setEditing(false)} />
        </div>
      </div>
    );
  }

  const initial = user.name?.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="px-4 pt-1 pb-4">
      {/* Inline back-chevron header (shadcn-hybrid look) */}
      <div className="flex items-center gap-1">
        <BackButton onClick={() => goMobile("home")} />
        <span className="text-[20px] font-bold tracking-[-.02em] text-ink">{t("title")}</span>
      </div>

      {/* Profile card */}
      <div className="mt-3 flex items-center gap-3 rounded-[12px] bg-primary p-3.5">
        <span className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full bg-white/25 text-[15px] font-bold text-onprimary">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-bold text-onprimary">{user.name}</div>
          <div className="truncate text-[11px] font-medium text-onprimary/85">{user.email}</div>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex min-h-11 flex-none items-center rounded-full bg-white/20 px-3.5 text-[11px] font-semibold text-onprimary"
        >
          {t("edit")}
        </button>
      </div>

      {/* Account */}
      <SectionLabel>{t("account")}</SectionLabel>
      <Card>
        <Row
          icon={<FolderInput size={15} strokeWidth={2} className="text-muted" />}
          label={t("importExport")}
          onClick={() => goMobile("import")}
          right={<ChevronRight size={14} strokeWidth={2} className="text-muted" />}
        />
        <Divider />
        <Row
          icon={<KeyRound size={15} strokeWidth={2} className="text-muted" />}
          label={t("connectedApps")}
          onClick={() => goMobile("connectedApps")}
          right={<ChevronRight size={14} strokeWidth={2} className="text-muted" />}
        />
        <Divider />
        <Row
          icon={<Tags size={15} strokeWidth={2} className="text-muted" />}
          label={t("rulesPanel.title")}
          onClick={() => goMobile("rules")}
          right={<ChevronRight size={14} strokeWidth={2} className="text-muted" />}
        />
        <Divider />
        <Row
          icon={<Shield size={15} strokeWidth={2} className="text-muted" />}
          label={t("securityPanel.title")}
          onClick={() => goMobile("security")}
          right={<ChevronRight size={14} strokeWidth={2} className="text-muted" />}
        />
        <Divider />
        <Row
          icon={<KeyRound size={15} strokeWidth={2} className="text-muted" />}
          label={t("logout")}
          onClick={() => router.push("/logout")}
          right={<ChevronRight size={14} strokeWidth={2} className="text-muted" />}
        />
      </Card>

      {/* Preferences */}
      <SectionLabel>{t("preferences")}</SectionLabel>
      <Card>
        <Row
          icon={<CircleDollarSign size={15} strokeWidth={2} className="text-muted" />}
          label={t("monthlyBudget")}
          onClick={() => goMobile("budget")}
          right={
            <div className="flex items-center gap-1">
              <span className="text-[12px] font-semibold text-muted">
                {fmt.money(user.budgetPoolCents)}
              </span>
              <ChevronRight size={14} strokeWidth={2} className="text-muted" />
            </div>
          }
        />
        <Divider />
        <Row
          icon={<CircleDollarSign size={15} strokeWidth={2} className="text-muted" />}
          label={t("currency")}
          right={<span className="text-[12px] font-semibold text-muted">CAD $</span>}
        />
        <Divider />
        <Row
          icon={<Globe size={15} strokeWidth={2} className="text-muted" />}
          label={t("budgetCycle")}
          right={
            <span className="text-[12px] font-semibold capitalize text-muted">
              {t(`cycle.${user.budgetCycle}`)}
            </span>
          }
        />
        <Divider />
        <Row
          icon={
            theme === "dark" ? (
              <Moon size={15} strokeWidth={2} className="text-muted" />
            ) : (
              <Sun size={15} strokeWidth={2} className="text-muted" />
            )
          }
          label={t("appearance")}
          right={
            <div className="flex gap-0.5 rounded-[10px] bg-track p-0.5">
              <ThemeSegment
                active={themePref === "system"}
                onClick={() => setThemePref("system")}
                icon={<Monitor size={14} strokeWidth={2} />}
                label={t("theme.auto")}
              />
              <ThemeSegment
                active={themePref === "light"}
                onClick={() => setThemePref("light")}
                icon={<Sun size={14} strokeWidth={2} />}
                label={t("theme.light")}
              />
              <ThemeSegment
                active={themePref === "dark"}
                onClick={() => setThemePref("dark")}
                icon={<Moon size={14} strokeWidth={2} />}
                label={t("theme.dark")}
              />
            </div>
          }
        />
        <Divider />
        <Row
          icon={<Languages size={15} strokeWidth={2} className="text-muted" />}
          label={t("language")}
          right={<LanguageToggle compact />}
        />
      </Card>

      <SectionLabel>{t("comingSoon")}</SectionLabel>
      <Card>
        <ComingSoonRow
          icon={<Bell size={15} strokeWidth={2} className="text-muted" />}
          label={t("notifications")}
          description={t("notificationsDesc")}
        />
      </Card>

      <div className="mt-4">
        <PwaInstallCard />
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-edge bg-card">{children}</div>
  );
}

function Divider() {
  return <div className="h-px bg-edge" />;
}

function Row({
  icon,
  label,
  right,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  right: React.ReactNode;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] bg-track">
        {icon}
      </span>
      <span className="flex-1 text-[14px] font-medium text-ink">{label}</span>
      {right}
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-2.5 px-3 py-3 text-left"
      >
        {content}
      </button>
    );
  }
  return <div className="flex items-center gap-2.5 px-3 py-3">{content}</div>;
}

function ComingSoonRow({
  icon,
  label,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2.5 px-3 py-3">
      <span className="mt-0.5 flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] bg-track">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium text-ink">{label}</div>
        <p className="mt-1 text-[12px] font-medium leading-relaxed text-muted">{description}</p>
      </div>
    </div>
  );
}

function ThemeSegment({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  const t = useTranslations("settingsPage.theme");
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={t("aria", { label })}
      title={label}
      className={`flex items-center justify-center rounded-[8px] px-3 py-2.5 transition ${
        active ? "bg-primary text-onprimary shadow-sm" : "text-muted"
      }`}
    >
      {icon}
    </button>
  );
}
