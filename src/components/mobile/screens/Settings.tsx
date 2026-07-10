"use client";

import {
  Bell,
  ChevronRight,
  CircleDollarSign,
  FolderInput,
  Globe,
  KeyRound,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EditProfileForm } from "@/components/shared/EditProfileForm";
import { BackButton, ScreenHeader } from "@/components/ui/headers";
import { formatMoney } from "@/lib/format";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

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
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="px-4 pt-3">
        <ScreenHeader title="Edit profile" onBack={() => setEditing(false)} />
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
        <span className="text-[20px] font-bold tracking-[-.02em] text-ink">Settings</span>
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
          className="flex-none rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-semibold text-onprimary"
        >
          Edit
        </button>
      </div>

      {/* Account */}
      <SectionLabel>Account</SectionLabel>
      <Card>
        <Row
          icon={<FolderInput size={15} strokeWidth={2} className="text-muted" />}
          label="Import / export"
          onClick={() => goMobile("import")}
          right={<ChevronRight size={14} strokeWidth={2} className="text-muted" />}
        />
        <Divider />
        <Row
          icon={<KeyRound size={15} strokeWidth={2} className="text-muted" />}
          label="Connected apps"
          onClick={() => goMobile("connectedApps")}
          right={<ChevronRight size={14} strokeWidth={2} className="text-muted" />}
        />
        <Divider />
        <Row
          icon={<Bell size={15} strokeWidth={2} className="text-muted" />}
          label="Notifications"
          right={
            <span className="rounded-full bg-track px-2 py-0.5 text-[10px] font-bold uppercase tracking-[.04em] text-muted">
              Soon
            </span>
          }
        />
      </Card>

      {/* Preferences */}
      <SectionLabel>Preferences</SectionLabel>
      <Card>
        <Row
          icon={<CircleDollarSign size={15} strokeWidth={2} className="text-muted" />}
          label="Monthly budget"
          onClick={() => goMobile("budget")}
          right={
            <div className="flex items-center gap-1">
              <span className="text-[12px] font-semibold text-muted">
                {formatMoney(user.budgetPoolCents)}
              </span>
              <ChevronRight size={14} strokeWidth={2} className="text-muted" />
            </div>
          }
        />
        <Divider />
        <Row
          icon={<CircleDollarSign size={15} strokeWidth={2} className="text-muted" />}
          label="Currency"
          right={<span className="text-[12px] font-semibold text-muted">CAD $</span>}
        />
        <Divider />
        <Row
          icon={<Globe size={15} strokeWidth={2} className="text-muted" />}
          label="Budget cycle"
          right={
            <span className="text-[12px] font-semibold capitalize text-muted">
              {user.budgetCycle}
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
          label="Appearance"
          right={
            <div className="flex gap-0.5 rounded-[10px] bg-track p-0.5">
              <ThemeSegment
                active={themePref === "system"}
                onClick={() => setThemePref("system")}
                icon={<Monitor size={14} strokeWidth={2} />}
                label="Auto"
              />
              <ThemeSegment
                active={themePref === "light"}
                onClick={() => setThemePref("light")}
                icon={<Sun size={14} strokeWidth={2} />}
                label="Light"
              />
              <ThemeSegment
                active={themePref === "dark"}
                onClick={() => setThemePref("dark")}
                icon={<Moon size={14} strokeWidth={2} />}
                label="Dark"
              />
            </div>
          }
        />
      </Card>

      <button
        type="button"
        onClick={() => router.push("/logout")}
        className="mt-5 w-full py-3 text-center text-[12.5px] font-semibold text-primary"
      >
        Log out
      </button>
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
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${label} theme`}
      title={label}
      className={`flex items-center justify-center rounded-[8px] px-3 py-2.5 transition ${
        active ? "bg-card text-ink shadow-sm" : "text-muted"
      }`}
    >
      {icon}
    </button>
  );
}
