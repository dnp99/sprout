"use client";

import { useState } from "react";
import { ordinal } from "@/lib/bills";
import type { RecurringItem } from "@/lib/types";
import { useStore } from "@/state/store";

type Kind = "expense" | "income";

/** Create or edit a recurring item (bill / subscription / income). Shared by the
 *  web modal + mobile screen. When `item` is passed it edits (with Delete). */
export function EditRecurringForm({ item, onDone }: { item?: RecurringItem; onDone: () => void }) {
  const { categories, saveRecurring, removeRecurring } = useStore();

  const [name, setName] = useState(item?.name ?? "");
  const [emoji, setEmoji] = useState(item?.emoji ?? "🧾");
  const [kind, setKind] = useState<Kind>(item?.isIncome ? "income" : "expense");
  const [amount, setAmount] = useState(item ? (Math.abs(item.amountCents) / 100).toFixed(2) : "");
  const [day, setDay] = useState(String(item?.dayOfMonth ?? 1));
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? "");
  const [paused, setPaused] = useState(item?.paused ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    const dollars = Number(amount);
    const dayNum = Number(day);
    if (!name.trim()) return setError("Give it a name.");
    if (!(dollars > 0)) return setError("Enter an amount greater than 0.");
    if (!(dayNum >= 1 && dayNum <= 31)) return setError("Day of month must be 1–31.");

    setBusy(true);
    setError("");
    try {
      const magnitude = Math.round(dollars * 100);
      await saveRecurring(
        {
          name: name.trim(),
          emoji: emoji.trim() || (kind === "income" ? "💰" : "🧾"),
          amountCents: kind === "income" ? magnitude : -magnitude,
          dayOfMonth: dayNum,
          paused,
          categoryId: kind === "income" ? null : categoryId || null,
        },
        item?.id,
      );
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save.");
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
      setError(e instanceof Error ? e.message : "Couldn't delete.");
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
            {k === "expense" ? "💸 Bill" : "💰 Income"}
          </button>
        ))}
      </div>

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
            placeholder={kind === "income" ? "Salary" : "Netflix"}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="flex gap-3">
        <Field label="Amount" className="flex-1">
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
        <Field label="Day of month" className="w-[120px]">
          <select value={day} onChange={(e) => setDay(e.target.value)} className={inputClass}>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {ordinal(d)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {kind === "expense" && (
        <Field label="Category (optional)">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass}
          >
            <option value="">— none —</option>
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
          <span className="text-[13px] font-bold text-ink">Paused</span>
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
            Delete
          </button>
        )}
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="flex-1 rounded-2xl bg-primary py-3 text-[14px] font-extrabold text-white disabled:opacity-50"
        >
          {busy ? "Saving…" : item ? "Save changes" : "Add"}
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
