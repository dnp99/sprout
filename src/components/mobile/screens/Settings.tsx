"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Toggle } from "@/components/ui/controls";
import { ScreenHeader } from "@/components/ui/headers";
import { useStore } from "@/state/store";

export function Settings() {
  const { user, goMobile, logout } = useStore();

  return (
    <div className="px-[22px] pt-3">
      <ScreenHeader title="Settings ⚙️" onBack={() => goMobile("home")} />

      <div className="mt-4 flex items-center gap-3.5 rounded-card bg-primary p-5 text-white">
        <Avatar size={56} />
        <div className="flex-1">
          <div className="text-[17px] font-extrabold">{user.name}</div>
          <div className="text-xs font-semibold opacity-85">{user.email}</div>
        </div>
        <span className="rounded-2xl bg-white/20 px-3 py-1.5 text-xs font-extrabold">Edit</span>
      </div>

      <SettingsGroup label="Account">
        <Row
          emoji="💳"
          label="Linked accounts & cards"
          right={<span className="font-extrabold text-subtle">›</span>}
        />
        <Row
          emoji="🔔"
          label="Notifications"
          right={<Toggle on activeColor="#d97a54" onClick={() => {}} />}
        />
      </SettingsGroup>

      <SettingsGroup label="Preferences">
        <Row
          emoji="💵"
          label="Currency"
          right={<span className="text-[13px] font-bold text-muted">USD · $</span>}
        />
        <Row
          emoji="🌐"
          label="Budget cycle"
          right={<span className="text-[13px] font-bold text-muted">Monthly</span>}
        />
        <Row
          emoji="🎨"
          label="Appearance"
          right={<span className="text-[13px] font-bold text-muted">Light</span>}
        />
      </SettingsGroup>

      <button
        type="button"
        onClick={logout}
        className="mt-5 w-full py-4 text-center text-sm font-extrabold text-primary-dark"
      >
        Log out
      </button>
    </div>
  );
}

function SettingsGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <div className="mt-5 text-xs font-extrabold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-2.5 flex flex-col gap-2.5">{children}</div>
    </>
  );
}

function Row({ emoji, label, right }: { emoji: string; label: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] bg-card px-4 py-3.5">
      <span className="text-xl">{emoji}</span>
      <span className="flex-1 text-sm font-extrabold text-ink">{label}</span>
      {right}
    </div>
  );
}
