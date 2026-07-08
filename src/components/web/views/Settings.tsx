"use client";

import { EditProfileForm } from "@/components/shared/EditProfileForm";
import { Toggle } from "@/components/ui/controls";
import { Modal } from "@/components/ui/overlays";
import { useStore } from "@/state/store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { CircleDollarSign, Globe, Palette, ChevronRight, Sun, Moon } from "lucide-react";

export function Settings() {
  const { user, theme, setTheme } = useStore(
    useShallow((s) => ({
      user: s.user,
      theme: s.theme,
      setTheme: s.setTheme,
    })),
  );
  const router = useRouter();
  const [notify, setNotify] = useState({ bills: true, weekly: true, overBudget: false });
  const [editing, setEditing] = useState(false);

  return (
    <>
      {editing && (
        <Modal title="Edit profile ✍️" onClose={() => setEditing(false)}>
          <div className="mt-4">
            <EditProfileForm onDone={() => setEditing(false)} />
          </div>
        </Modal>
      )}

      <div className="mt-4 grid grid-cols-1 gap-[18px] md:grid-cols-2">
        {/* Profile card */}
        <div className="flex items-center gap-[14px] rounded-[14px] border border-edge p-5">
          <span className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-full bg-primary text-[19px] font-bold text-onprimary">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <div className="flex-1">
            <div className="text-base font-bold text-ink">{user.name}</div>
            <div className="text-[12.5px] font-medium text-muted">{user.email}</div>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-[9px] bg-primary px-3.5 py-2 text-[12.5px] font-semibold text-onprimary"
          >
            Edit profile
          </button>
        </div>

        {/* Preferences */}
        <Panel title="Preferences">
          <IconRow icon={<CircleDollarSign size={15} strokeWidth={2} />} label="Currency">
            <span className="text-[13px] font-semibold text-muted">{user.currency}</span>
          </IconRow>
          <IconRow icon={<Globe size={15} strokeWidth={2} />} label="Budget cycle">
            <span className="text-[13px] font-semibold capitalize text-muted">
              {user.budgetCycle}
            </span>
          </IconRow>
          <IconRow icon={<Palette size={15} strokeWidth={2} />} label="Appearance">
            <AppearanceToggle theme={theme} setTheme={setTheme} />
          </IconRow>
        </Panel>

        {/* Notifications */}
        <Panel title="Notifications">
          <ToggleRow
            label="Bill reminders"
            on={notify.bills}
            onClick={() => setNotify((n) => ({ ...n, bills: !n.bills }))}
          />
          <ToggleRow
            label="Weekly summary"
            on={notify.weekly}
            onClick={() => setNotify((n) => ({ ...n, weekly: !n.weekly }))}
          />
          <ToggleRow
            label="Over-budget alerts"
            on={notify.overBudget}
            onClick={() => setNotify((n) => ({ ...n, overBudget: !n.overBudget }))}
          />
        </Panel>

        {/* Security */}
        <Panel title="Security">
          <div className="flex items-center justify-between py-[13px]">
            <span className="text-[13.5px] font-semibold text-ink">Two-factor auth</span>
            <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-green">
              On
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-edge py-[13px]">
            <span className="text-[13.5px] font-semibold text-ink">Change password</span>
            <ChevronRight size={14} strokeWidth={2} className="text-muted" />
          </div>
        </Panel>
      </div>

      {/* Actions */}
      <div className="mt-[18px] flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/logout")}
          className="flex-1 rounded-[10px] border border-edge py-[11px] text-center text-[13px] font-semibold text-primary"
        >
          Log out
        </button>
        <button
          type="button"
          className="flex-1 rounded-[10px] border border-soft-border bg-primary-soft py-[11px] text-center text-[13px] font-semibold text-primary"
        >
          Delete account
        </button>
      </div>
    </>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="h-max rounded-[14px] border border-edge px-[18px] py-1.5">
      <div className="pb-0.5 pt-3.5 text-[11px] font-bold uppercase tracking-[0.05em] text-muted">
        {title}
      </div>
      {children}
    </div>
  );
}

/** Preference row with a leading icon tile, label, and trailing control/value. */
function IconRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-[13px]">
      <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] bg-track text-muted">
        {icon}
      </span>
      <span className="flex-1 text-[13.5px] font-semibold text-ink">{label}</span>
      {children}
    </div>
  );
}

/** Light/dark segmented control wired to the store's theme. */
function AppearanceToggle({
  theme,
  setTheme,
}: {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}) {
  const options: { value: "light" | "dark"; icon: React.ReactNode }[] = [
    { value: "light", icon: <Sun size={14} strokeWidth={2} /> },
    { value: "dark", icon: <Moon size={14} strokeWidth={2} /> },
  ];
  return (
    <div className="flex gap-1 rounded-[10px] bg-track p-1">
      {options.map((option) => {
        const active = option.value === theme;
        return (
          <button
            key={option.value}
            type="button"
            aria-label={option.value === "light" ? "Light theme" : "Dark theme"}
            aria-pressed={active}
            onClick={() => setTheme(option.value)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-semibold capitalize transition ${
              active ? "bg-card text-ink shadow-sm" : "text-muted"
            }`}
          >
            {option.icon}
            {option.value}
          </button>
        );
      })}
    </div>
  );
}

function ToggleRow({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center justify-between py-[13px]">
      <span className="text-[13.5px] font-semibold text-ink">{label}</span>
      <Toggle on={on} onClick={onClick} />
    </div>
  );
}
