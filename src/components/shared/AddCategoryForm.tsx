"use client";

import { useState } from "react";
import { useStore } from "@/state/store";

const ICONS = ["🏷️", "🌟", "🎉", "📱", "🏃", "🐶", "☕", "🎁", "🚕", "🩺", "📚", "🏠"];
const COLORS = ["#c98a5a", "#d97a54", "#e7a34a", "#7e9b6b", "#9a7b5a", "#c25b3a"];

/** Create a spending category (shared by web modal + mobile screen). */
export function AddCategoryForm({ onDone }: { onDone: () => void }) {
  const { createCategory } = useStore();

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [budget, setBudget] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!name.trim()) return setError("Name your category.");
    setBusy(true);
    setError("");
    try {
      await createCategory({
        name: name.trim(),
        emoji,
        color,
        monthlyBudgetCents: Math.max(0, Math.round((Number(budget) || 0) * 100)),
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create the category.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col items-center gap-2">
        <span
          className="flex h-16 w-16 items-center justify-center rounded-3xl text-4xl"
          style={{ background: `${color}33` }}
        >
          {emoji}
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name it something fun"
          className="w-full bg-transparent text-center text-lg font-extrabold text-ink outline-none placeholder:text-subtle"
        />
      </div>

      <Label>Pick an icon</Label>
      <div className="flex flex-wrap gap-2.5">
        {ICONS.map((icon) => (
          <button
            key={icon}
            type="button"
            onClick={() => setEmoji(icon)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card text-[22px]"
            style={emoji === icon ? { boxShadow: "0 0 0 2px #d97a54" } : undefined}
          >
            {icon}
          </button>
        ))}
      </div>

      <Label>Color</Label>
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

      <Label>Monthly budget</Label>
      <div className="flex items-center gap-1.5 rounded-xl border border-track bg-card px-3 py-2.5">
        <span className="text-[15px] font-extrabold text-muted">$</span>
        <input
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          inputMode="decimal"
          placeholder="0.00"
          className="w-full bg-transparent text-[14px] font-semibold text-ink outline-none"
        />
        <span className="text-[11.5px] font-semibold text-muted">/mo</span>
      </div>

      {error && <div className="text-[13px] font-semibold text-primary-dark">{error}</div>}

      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="mt-1 w-full rounded-2xl bg-primary py-3 text-[14px] font-extrabold text-white disabled:opacity-50"
      >
        {busy ? "Creating…" : "Create category 🌱"}
      </button>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-extrabold uppercase tracking-wide text-muted">
      {children}
    </span>
  );
}
