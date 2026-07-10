"use client";

import { ConnectedApps } from "@/components/settings/ConnectedApps";
import { EditProfileForm } from "@/components/shared/EditProfileForm";
import { Modal } from "@/components/ui/overlays";
import { formatMoney } from "@/lib/format";
import { useStore } from "@/state/store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { CircleDollarSign, Globe, Palette, ChevronRight, Monitor, Sun, Moon } from "lucide-react";

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
                Edit profile
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <AccountAction
                label="Import / export"
                description="Upload a CSV or export your data."
                onClick={() => set({ webView: "import" })}
              />
              <AccountAction
                label="Log out"
                description="Sign out of this browser session."
                onClick={() => router.push("/logout")}
              />
            </div>
          </Panel>

          <Panel title="Preferences">
            <IconRow
              icon={<CircleDollarSign size={15} strokeWidth={2} />}
              label="Monthly budget"
              onClick={() => set({ webEditBudgetOpen: true })}
            >
              <div className="flex items-center gap-1">
                <span className="text-[13px] font-semibold text-muted">
                  {formatMoney(user.budgetPoolCents)}
                </span>
                <ChevronRight size={14} strokeWidth={2} className="text-muted" />
              </div>
            </IconRow>
            <IconRow icon={<CircleDollarSign size={15} strokeWidth={2} />} label="Currency">
              <span className="text-[13px] font-semibold text-muted">CAD $</span>
            </IconRow>
            <IconRow icon={<Globe size={15} strokeWidth={2} />} label="Budget cycle">
              <span className="text-[13px] font-semibold capitalize text-muted">
                {user.budgetCycle}
              </span>
            </IconRow>
            <IconRow icon={<Palette size={15} strokeWidth={2} />} label="Appearance">
              <AppearanceToggle pref={themePref} setPref={setThemePref} />
            </IconRow>
          </Panel>
        </div>

        {/* Keep live settings above placeholders so the desktop page puts active
            controls first and relegates roadmap items to the bottom. */}
        <ConnectedApps />

        <Panel title="Coming soon">
          <div className="grid gap-4 py-2 lg:grid-cols-2">
            <ComingSoonCard
              title="Notifications"
              description="Bill reminders, weekly summaries, and over-budget alerts."
            />
            <ComingSoonCard title="Security" description="Two-factor auth and password changes." />
          </div>
        </Panel>
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

const THEME_OPTIONS: { value: ThemePref; label: string; icon: React.ReactNode }[] = [
  { value: "system", label: "System", icon: <Monitor size={14} strokeWidth={2} /> },
  { value: "light", label: "Light", icon: <Sun size={14} strokeWidth={2} /> },
  { value: "dark", label: "Dark", icon: <Moon size={14} strokeWidth={2} /> },
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
  return (
    <div className="flex gap-1 rounded-[10px] bg-track p-1">
      {THEME_OPTIONS.map((option) => {
        const active = option.value === pref;
        return (
          <button
            key={option.value}
            type="button"
            aria-label={`${option.label} theme`}
            aria-pressed={active}
            onClick={() => setPref(option.value)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-semibold transition ${
              active ? "bg-card text-ink shadow-sm" : "text-muted"
            }`}
          >
            {option.icon}
            {option.label}
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
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-track px-2 py-0.5 text-[10px] font-bold uppercase tracking-[.04em] text-muted">
          Soon
        </span>
        <span className="text-[13px] font-semibold text-ink">{title}</span>
      </div>
      <p className="mt-2 text-[12.5px] font-medium leading-relaxed text-muted">{description}</p>
    </div>
  );
}
