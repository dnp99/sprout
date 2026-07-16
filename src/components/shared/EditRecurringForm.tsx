"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { monthName, weekdayName } from "@/components/shared/useRecurringLabels";
import { useFormatters } from "@/i18n/useFormatters";
import type { Cadence, RecurringItem } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

type Kind = "expense" | "income";

const CADENCES: { value: Cadence; labelKey: "monthly" | "weekly" | "yearly" }[] = [
  { value: "monthly", labelKey: "monthly" },
  { value: "weekly", labelKey: "weekly" },
  { value: "yearly", labelKey: "yearly" },
];

/** Create or edit a recurring item (bill / subscription / income). Shared by the
 *  web modal + mobile screen. When `item` is passed it edits (with Delete). */
export function EditRecurringForm({ item, onDone }: { item?: RecurringItem; onDone: () => void }) {
  const { categories, saveRecurring, removeRecurring } = useStore(
    useShallow((s) => ({
      categories: s.categories,
      saveRecurring: s.saveRecurring,
      removeRecurring: s.removeRecurring,
    })),
  );
  const t = useTranslations("bills.form");
  const fmt = useFormatters();

  const [name, setName] = useState(item?.name ?? "");
  const [emoji, setEmoji] = useState(item?.emoji ?? "🧾");
  const [kind, setKind] = useState<Kind>(item?.isIncome ? "income" : "expense");
  const [amount, setAmount] = useState(item ? (Math.abs(item.amountCents) / 100).toFixed(2) : "");
  const [cadence, setCadence] = useState<Cadence>(item?.cadence ?? "monthly");
  const [day, setDay] = useState(String(item?.dayOfMonth ?? 1));
  const [dayOfWeek, setDayOfWeek] = useState(String(item?.dayOfWeek ?? 1));
  const [monthOfYear, setMonthOfYear] = useState(String(item?.monthOfYear ?? 1));
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? "");
  const [paused, setPaused] = useState(item?.paused ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    const dollars = Number(amount);
    const dayNum = Number(day);
    if (!name.trim()) return setError(t("errName"));
    if (!(dollars > 0)) return setError(t("errAmount"));
    if (cadence !== "weekly" && !(dayNum >= 1 && dayNum <= 31)) {
      return setError(t("errDay"));
    }

    setBusy(true);
    setError("");
    try {
      const magnitude = Math.round(dollars * 100);
      await saveRecurring(
        {
          name: name.trim(),
          emoji: emoji.trim() || (kind === "income" ? "💰" : "🧾"),
          amountCents: kind === "income" ? magnitude : -magnitude,
          cadence,
          dayOfMonth: cadence === "weekly" ? 1 : dayNum,
          dayOfWeek: cadence === "weekly" ? Number(dayOfWeek) : null,
          monthOfYear: cadence === "yearly" ? Number(monthOfYear) : null,
          paused,
          categoryId: kind === "income" ? null : categoryId || null,
        },
        item?.id,
      );
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errSave"));
      setBusy(false);
    }
  }

  async function remove() {
    if (!item) return;
    setBusy(true);
    setError("");
    try {
      await removeRecurring(item.id);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errDelete"));
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex rounded-xl bg-track p-1">
        {(["expense", "income"] as Kind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`flex-1 rounded-lg py-2 text-[13px] font-extrabold capitalize ${
              kind === k ? "bg-card text-ink shadow-sm" : "text-muted"
            }`}
          >
            {k === "expense" ? t("bill") : t("income")}
          </button>
        ))}
      </div>

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
            placeholder={
              kind === "income" ? t("namePlaceholderIncome") : t("namePlaceholderExpense")
            }
            className={inputClass}
          />
        </Field>
      </div>

      <Field label={t("amount")}>
        <div className="flex items-center gap-1.5">
          <span className="text-[15px] font-extrabold text-muted">$</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            className={inputClass}
          />
        </div>
      </Field>

      <Field label={t("repeats")}>
        <select
          value={cadence}
          onChange={(e) => setCadence(e.target.value as Cadence)}
          className={inputClass}
        >
          {CADENCES.map((c) => (
            <option key={c.value} value={c.value}>
              {t(c.labelKey)}
            </option>
          ))}
        </select>
      </Field>

      {/* Anchor input swaps by cadence. */}
      {cadence === "weekly" ? (
        <Field label={t("dayOfWeek")}>
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(e.target.value)}
            className={inputClass}
          >
            {Array.from({ length: 7 }, (_, i) => (
              <option key={i} value={i}>
                {weekdayName(i, fmt.locale)}
              </option>
            ))}
          </select>
        </Field>
      ) : cadence === "yearly" ? (
        <div className="flex gap-3">
          <Field label={t("month")} className="flex-1">
            <select
              value={monthOfYear}
              onChange={(e) => setMonthOfYear(e.target.value)}
              className={inputClass}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i + 1}>
                  {monthName(i, fmt.locale)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("day")} className="w-[110px]">
            <select value={day} onChange={(e) => setDay(e.target.value)} className={inputClass}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {t("ordinalDay", { day: d })}
                </option>
              ))}
            </select>
          </Field>
        </div>
      ) : (
        <Field label={t("dayOfMonth")}>
          <select value={day} onChange={(e) => setDay(e.target.value)} className={inputClass}>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {t("ordinalDay", { day: d })}
              </option>
            ))}
          </select>
        </Field>
      )}

      {kind === "expense" && (
        <Field label={t("category")}>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass}
          >
            <option value="">{t("none")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      {item && (
        <label className="flex cursor-pointer items-center justify-between rounded-xl bg-card px-3 py-2.5">
          <span className="text-[13px] font-bold text-ink">{t("paused")}</span>
          <input
            type="checkbox"
            checked={paused}
            onChange={(e) => setPaused(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
        </label>
      )}

      {error && <div className="text-[13px] font-semibold text-primary-dark">{error}</div>}

      <div className="mt-1 flex gap-2.5">
        {item && (
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
          {busy ? t("saving") : item ? t("saveChanges") : t("add")}
        </button>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-track bg-card px-3 py-2.5 text-[14px] font-semibold text-ink outline-none";

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
