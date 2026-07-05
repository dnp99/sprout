"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Toggle } from "@/components/ui/controls";
import { useStore } from "@/state/store";
import { useState } from "react";

export function Settings() {
  const { user, accounts, logout } = useStore();
  const [notify, setNotify] = useState({ bills: true, weekly: true, overBudget: false });

  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-[1.4] flex-col gap-4">
        <div className="flex items-center gap-4 rounded-[20px] bg-card p-6">
          <Avatar size={60} />
          <div className="flex-1">
            <div className="text-lg font-extrabold text-ink">{user.name}</div>
            <div className="text-[12.5px] font-semibold text-muted">{user.email}</div>
          </div>
          <span className="rounded-xl bg-primary px-4 py-2 text-[12.5px] font-extrabold text-white">
            Edit profile
          </span>
        </div>

        <div className="rounded-[20px] bg-card p-6">
          <div className="mb-2 text-sm font-extrabold text-ink">Connected accounts</div>
          {accounts.length === 0 && (
            <div className="py-3 text-[12.5px] font-semibold text-muted">
              No accounts yet — import a CSV to add them.
            </div>
          )}
          {accounts.map((account, i) => (
            <div
              key={account.id}
              className={`flex items-center gap-3 py-3 ${i < accounts.length - 1 ? "border-b border-[#f7efe3]" : ""}`}
            >
              <span className="text-[22px]">{account.emoji}</span>
              <div className="flex-1">
                <div className="text-[13.5px] font-extrabold text-ink">{account.name}</div>
                <div className="text-[11.5px] text-muted">
                  {account.last4 ? `•••• ${account.last4} · ` : ""}
                  {account.syncedLabel}
                </div>
              </div>
              <span className="rounded-xl bg-[#e4ebd6] px-2.5 py-1 text-[11px] font-extrabold text-[#4f7a3a]">
                {account.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <Panel title="Preferences">
          <PrefRow label="💵 Currency" value="USD · $" />
          <PrefRow label="🌐 Budget cycle" value="Monthly" />
          <PrefRow label="🎨 Appearance" value="Light" last />
        </Panel>

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
            last
          />
        </Panel>

        <Panel title="Security">
          <div className="flex items-center justify-between border-b border-[#f7efe3] py-3">
            <span className="text-[13.5px] font-bold text-ink">Two-factor auth</span>
            <span className="rounded-xl bg-[#e4ebd6] px-2.5 py-1 text-[11px] font-extrabold text-[#4f7a3a]">
              On
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-[13.5px] font-bold text-ink">Change password</span>
            <span className="font-extrabold text-subtle">›</span>
          </div>
        </Panel>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={logout}
            className="flex-1 rounded-[14px] bg-card py-3.5 text-center text-[13px] font-extrabold text-primary-dark"
          >
            Log out
          </button>
          <button
            type="button"
            className="flex-1 rounded-[14px] bg-[#f7e4dc] py-3.5 text-center text-[13px] font-extrabold text-primary-dark"
          >
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[20px] bg-card p-6">
      <div className="mb-1.5 text-sm font-extrabold text-ink">{title}</div>
      {children}
    </div>
  );
}

function PrefRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between py-3 ${last ? "" : "border-b border-[#f7efe3]"}`}
    >
      <span className="text-[13.5px] font-bold text-ink">{label}</span>
      <span className="text-[13px] font-bold text-muted">{value}</span>
    </div>
  );
}

function ToggleRow({
  label,
  on,
  onClick,
  last,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-3 ${last ? "" : "border-b border-[#f7efe3]"}`}
    >
      <span className="text-[13.5px] font-bold text-ink">{label}</span>
      <Toggle on={on} onClick={onClick} />
    </div>
  );
}
