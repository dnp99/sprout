"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { User } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

const CYCLES: User["budgetCycle"][] = ["monthly", "weekly", "biweekly"];

/** Edit the signed-in user's name, monthly budget, and budget cycle. Email and
 *  currency are shown read-only (email is the login identity; currency is fixed
 *  to CAD for all users for now). Shared by web + mobile. */
export function EditProfileForm({ onDone }: { onDone: () => void }) {
  const { user, updateProfile } = useStore(
    useShallow((s) => ({ user: s.user, updateProfile: s.updateProfile })),
  );
  const t = useTranslations("settingsPage");

  const [name, setName] = useState(user.name);
  const [budgetCycle, setBudgetCycle] = useState<User["budgetCycle"]>(user.budgetCycle);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!name.trim()) return setError(t("profile.errName"));
    setBusy(true);
    setError("");
    try {
      // Budget lives in the Edit budget editor now (pool + allocation), not here —
      // this form is identity/preferences only. See plans/007.
      await updateProfile({ name: name.trim(), currency: "CAD", budgetCycle });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("profile.errSave"));
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Field label={t("profile.name")}>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </Field>

      <Field label={t("profile.email")}>
        <input value={user.email} disabled className={`${inputClass} text-muted`} />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("profile.currency")}>
          <input value="CAD $" disabled className={`${inputClass} text-muted`} />
        </Field>
        <Field label={t("profile.budgetCycle")}>
          <select
            value={budgetCycle}
            onChange={(e) => setBudgetCycle(e.target.value as User["budgetCycle"])}
            className={`${inputClass} capitalize`}
          >
            {CYCLES.map((c) => (
              <option key={c} value={c} className="capitalize">
                {t(`cycle.${c}`)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {error && <div className="text-[13px] font-semibold text-primary-dark">{error}</div>}

      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="mt-1 w-full rounded-2xl bg-primary py-3 text-[14px] font-extrabold text-white disabled:opacity-50"
      >
        {busy ? t("profile.saving") : t("profile.saveChanges")}
      </button>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-track bg-card px-3 py-2.5 text-[16px] font-semibold text-ink outline-none disabled:opacity-70";

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[11px] font-extrabold uppercase tracking-wide text-muted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
