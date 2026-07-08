"use client";

import { EditProfileForm } from "@/components/shared/EditProfileForm";
import { Avatar } from "@/components/ui/Avatar";
import { Toggle } from "@/components/ui/controls";
import { Modal } from "@/components/ui/overlays";
import { useStore } from "@/state/store";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function Settings() {
  const { user } = useStore();
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
      <div className="flex items-start gap-4">
        <div className="flex flex-[1.4] flex-col gap-4">
          <div className="flex items-center gap-4 rounded-[20px] bg-card p-6">
            <Avatar size={60} />
            <div className="flex-1">
              <div className="text-lg font-extrabold text-ink">{user.name}</div>
              <div className="text-[12.5px] font-semibold text-muted">{user.email}</div>
            </div>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-xl bg-primary px-4 py-2 text-[12.5px] font-extrabold text-white"
            >
              Edit profile
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4">
          <Panel title="Preferences">
            <PrefRow label="💵 Currency" value={user.currency} />
            <PrefRow label="🌐 Budget cycle" value={user.budgetCycle} valueClass="capitalize" />
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
              onClick={() => router.push("/logout")}
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
    </>
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

function PrefRow({
  label,
  value,
  last,
  valueClass,
}: {
  label: string;
  value: string;
  last?: boolean;
  valueClass?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between py-3 ${last ? "" : "border-b border-[#f7efe3]"}`}
    >
      <span className="text-[13.5px] font-bold text-ink">{label}</span>
      <span className={`text-[13px] font-bold text-muted ${valueClass ?? ""}`}>{value}</span>
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
