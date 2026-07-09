"use client";

import { useState } from "react";
import type { User } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

const CYCLES: User["budgetCycle"][] = ["monthly", "weekly", "biweekly"];

/** Edit the signed-in user's name, monthly budget, currency and budget cycle.
 *  Email is shown read-only (it's the login identity). Shared by web + mobile. */
export function EditProfileForm({ onDone }: { onDone: () => void }) {
  const { user, updateProfile } = useStore(
    useShallow((s) => ({ user: s.user, updateProfile: s.updateProfile })),
  );

  const [name, setName] = useState(user.name);
  const [currency, setCurrency] = useState(user.currency);
  const [budgetCycle, setBudgetCycle] = useState<User["budgetCycle"]>(user.budgetCycle);
  const [budgetPool, setBudgetPool] = useState(formatBudgetInput(user.budgetPoolCents));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!name.trim()) return setError("Name is required.");
    const budgetPoolCents = parseBudgetPool(budgetPool);
    if (budgetPoolCents <= 0) return setError("Monthly budget must be greater than zero.");
    setBusy(true);
    setError("");
    try {
      await updateProfile({
        name: name.trim(),
        currency: currency.trim() || "CAD",
        budgetCycle,
        budgetPoolCents,
      });
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

      <Field label="Monthly budget">
        <input
          value={budgetPool}
          onChange={(e) => setBudgetPool(e.target.value)}
          inputMode="decimal"
          placeholder="4,000"
          className={inputClass}
        />
        <div className="mt-1 text-[11px] font-medium text-muted">
          Sets the total amount you want available to allocate each month.
        </div>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Currency">
          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={8}
            className={inputClass}
          />
        </Field>
        <Field label="Budget cycle">
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
  "w-full rounded-xl border border-track bg-card px-3 py-2.5 text-[16px] font-semibold text-ink outline-none disabled:opacity-70";

function formatBudgetInput(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function parseBudgetPool(value: string): number {
  const numeric = Number(value.replace(/[^0-9.]/g, ""));
  if (!isFinite(numeric) || numeric <= 0) return 0;
  return Math.round(numeric * 100);
}

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
