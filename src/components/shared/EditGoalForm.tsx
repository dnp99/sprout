"use client";

import { useState } from "react";
import type { Goal } from "@/lib/types";
import { useStore } from "@/state/store";

const COLORS = ["#e7a34a", "#7e9b6b", "#d97a54", "#c98a5a", "#9a7b5a", "#c25b3a"];

/** Create or edit a savings goal (shared by web modal + mobile screen). When
 *  `goal` is passed it edits (with a Delete action); otherwise it creates. */
export function EditGoalForm({ goal, onDone }: { goal?: Goal; onDone: () => void }) {
  const { saveGoal, removeGoal } = useStore();

  const [name, setName] = useState(goal?.name ?? "");
  const [emoji, setEmoji] = useState(goal?.emoji ?? "🎯");
  const [color, setColor] = useState(goal?.color ?? COLORS[0]);
  const [target, setTarget] = useState(goal ? (goal.targetCents / 100).toFixed(2) : "");
  const [saved, setSaved] = useState(goal ? (goal.savedCents / 100).toFixed(2) : "0");
  const [month, setMonth] = useState(goal?.targetDate ? goal.targetDate.slice(0, 7) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    const targetDollars = Number(target);
    const savedDollars = Number(saved) || 0;
    if (!name.trim()) return setError("Give your goal a name.");
    if (!(targetDollars > 0)) return setError("Set a target greater than 0.");

    setBusy(true);
    setError("");
    try {
      await saveGoal(
        {
          name: name.trim(),
          emoji: emoji.trim() || "🎯",
          color,
          targetCents: Math.round(targetDollars * 100),
          savedCents: Math.max(0, Math.round(savedDollars * 100)),
          targetDate: month ? `${month}-01` : null,
        },
        goal?.id,
      );
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the goal.");
      setBusy(false);
    }
  }

  async function remove() {
    if (!goal) return;
    setBusy(true);
    setError("");
    try {
      await removeGoal(goal.id);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't delete.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <Field label="Icon" className="w-[76px]">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={2}
            className={`${inputClass} text-center text-lg`}
          />
        </Field>
        <Field label="Name" className="flex-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Japan trip"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="flex gap-3">
        <Field label="Target" className="flex-1">
          <Money value={target} onChange={setTarget} placeholder="5000.00" />
        </Field>
        <Field label="Saved so far" className="flex-1">
          <Money value={saved} onChange={setSaved} placeholder="0.00" />
        </Field>
      </div>

      <Field label="Target date (optional)">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Color">
        <div className="flex gap-2.5">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`color ${c}`}
              onClick={() => setColor(c)}
              className={`h-8 w-8 rounded-full ${color === c ? "ring-2 ring-ink ring-offset-2" : ""}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </Field>

      {error && <div className="text-[13px] font-semibold text-primary-dark">{error}</div>}

      <div className="mt-1 flex gap-2.5">
        {goal && (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="rounded-2xl bg-[#f7e4dc] px-4 py-3 text-[14px] font-extrabold text-primary-dark disabled:opacity-50"
          >
            Delete
          </button>
        )}
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="flex-1 rounded-2xl bg-primary py-3 text-[14px] font-extrabold text-white disabled:opacity-50"
        >
          {busy ? "Saving…" : goal ? "Save changes" : "Create goal"}
        </button>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-track bg-card px-3 py-2.5 text-[14px] font-semibold text-ink outline-none";

function Money({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[15px] font-extrabold text-muted">$</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
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
