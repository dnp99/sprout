"use client";

import { useState } from "react";
import type { User } from "@/lib/types";
import { useStore } from "@/state/store";

const CYCLES: User["budgetCycle"][] = ["monthly", "weekly", "biweekly"];

/** Edit the signed-in user's name, currency and budget cycle. Email is shown
 *  read-only (it's the login identity). Shared by web + mobile. */
export function EditProfileForm({ onDone }: { onDone: () => void }) {
  const { user, updateProfile } = useStore();

  const [name, setName] = useState(user.name);
  const [currency, setCurrency] = useState(user.currency);
  const [budgetCycle, setBudgetCycle] = useState<User["budgetCycle"]>(user.budgetCycle);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!name.trim()) return setError("Name is required.");
    setBusy(true);
    setError("");
    try {
      await updateProfile({ name: name.trim(), currency: currency.trim() || "USD", budgetCycle });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save changes.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Field label="Name">
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </Field>

      <Field label="Email">
        <input value={user.email} disabled className={`${inputClass} text-muted`} />
      </Field>

      <div className="flex gap-3">
        <Field label="Currency" className="flex-1">
          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={8}
            className={inputClass}
          />
        </Field>
        <Field label="Budget cycle" className="flex-1">
          <select
            value={budgetCycle}
            onChange={(e) => setBudgetCycle(e.target.value as User["budgetCycle"])}
            className={`${inputClass} capitalize`}
          >
            {CYCLES.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c}
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
        {busy ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-track bg-card px-3 py-2.5 text-[14px] font-semibold text-ink outline-none disabled:opacity-70";

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
