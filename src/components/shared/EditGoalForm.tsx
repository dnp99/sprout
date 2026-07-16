"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Goal } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

const COLORS = ["#e7a34a", "#7e9b6b", "#d97a54", "#c98a5a", "#9a7b5a", "#c25b3a"];

/** Create or edit a savings goal (shared by web modal + mobile screen). When
 *  `goal` is passed it edits (with a Delete action); otherwise it creates. */
export function EditGoalForm({ goal, onDone }: { goal?: Goal; onDone: () => void }) {
  const { saveGoal, removeGoal } = useStore(
    useShallow((s) => ({ saveGoal: s.saveGoal, removeGoal: s.removeGoal })),
  );
  const t = useTranslations("goals.form");

  const [name, setName] = useState(goal?.name ?? "");
  const [emoji, setEmoji] = useState(goal?.emoji ?? "🎯");
  const [color, setColor] = useState(goal?.color ?? COLORS[0]);
  const [target, setTarget] = useState(goal ? (goal.targetCents / 100).toFixed(2) : "");
  const [saved, setSaved] = useState(goal ? (goal.savedCents / 100).toFixed(2) : "0");
  const [month, setMonth] = useState(goal?.targetDate ? goal.targetDate.slice(0, 7) : "");
  const [isRoundupTarget, setIsRoundupTarget] = useState(goal?.isRoundupTarget ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    const targetDollars = Number(target);
    const savedDollars = Number(saved) || 0;
    if (!name.trim()) return setError(t("errName"));
    if (!(targetDollars > 0)) return setError(t("errTarget"));

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
          isRoundupTarget,
        },
        goal?.id,
      );
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errSave"));
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
      setError(e instanceof Error ? e.message : t("errDelete"));
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <Field label={t("icon")} className="w-[76px]">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={2}
            className={`${inputClass} text-center text-lg`}
          />
        </Field>
        <Field label={t("name")} className="flex-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="flex gap-3">
        <Field label={t("target")} className="flex-1">
          <Money value={target} onChange={setTarget} placeholder="5000.00" />
        </Field>
        <Field label={t("savedSoFar")} className="flex-1">
          <Money value={saved} onChange={setSaved} placeholder="0.00" />
        </Field>
      </div>

      <Field label={t("targetDate")}>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label={t("color")}>
        <div className="flex gap-2.5">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={t("colorAria", { color: c })}
              onClick={() => setColor(c)}
              className={`h-9 w-9 rounded-full ${color === c ? "ring-2 ring-ink ring-offset-2" : ""}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </Field>

      <button
        type="button"
        onClick={() => setIsRoundupTarget((v) => !v)}
        aria-pressed={isRoundupTarget}
        className="flex items-start gap-3 rounded-xl border border-track bg-card px-3 py-2.5 text-left"
      >
        <span
          className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md border-2 ${
            isRoundupTarget ? "border-primary bg-primary text-white" : "border-muted bg-card"
          }`}
        >
          {isRoundupTarget ? "✓" : ""}
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] font-extrabold text-ink">{t("roundupTitle")}</span>
          <span className="block text-[11.5px] font-semibold text-muted">{t("roundupBody")}</span>
        </span>
      </button>

      {error && <div className="text-[13px] font-semibold text-primary-dark">{error}</div>}

      <div className="mt-1 flex gap-2.5">
        {goal && (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="rounded-2xl bg-[#f7e4dc] px-4 py-3 text-[14px] font-extrabold text-primary-dark disabled:opacity-50"
          >
            {t("delete")}
          </button>
        )}
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="flex-1 rounded-2xl bg-primary py-3 text-[14px] font-extrabold text-white disabled:opacity-50"
        >
          {busy ? t("saving") : goal ? t("saveChanges") : t("create")}
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
