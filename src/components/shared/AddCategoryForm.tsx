"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Category } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

const ICONS = ["🏷️", "🌟", "🎉", "📱", "🏃", "🐶", "☕", "🎁", "🚕", "🩺", "📚", "🏠"];
const COLORS = ["#c98a5a", "#d97a54", "#e7a34a", "#7e9b6b", "#9a7b5a", "#c25b3a"];

/** Create or edit a spending category (shared by web modal + mobile screen).
 *  Passing `category` switches the form into edit mode (prefilled + Delete). */
export function AddCategoryForm({ category, onDone }: { category?: Category; onDone: () => void }) {
  const { saveCategory, removeCategory } = useStore(
    useShallow((s) => ({ saveCategory: s.saveCategory, removeCategory: s.removeCategory })),
  );
  const editing = Boolean(category);

  const [name, setName] = useState(category?.name ?? "");
  const [emoji, setEmoji] = useState(category?.emoji ?? ICONS[0]);
  const [color, setColor] = useState(category?.color ?? COLORS[0]);
  const [budget, setBudget] = useState(category ? String(category.monthlyBudgetCents / 100) : "");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!name.trim()) return setError("Name your category.");
    setBusy(true);
    setError("");
    try {
      await saveCategory(
        {
          name: name.trim(),
          emoji,
          color,
          monthlyBudgetCents: Math.max(0, Math.round((Number(budget) || 0) * 100)),
        },
        category?.id,
      );
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the category.");
      setBusy(false);
    }
  }

  async function remove() {
    if (!category) return;
    setBusy(true);
    setError("");
    try {
      await removeCategory(category.id);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't delete the category.");
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
        {busy ? "Saving…" : editing ? "Save changes ✅" : "Create category 🌱"}
      </button>

      {editing && (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          disabled={busy}
          className="w-full py-1 text-[13px] font-extrabold text-primary-dark disabled:opacity-50"
        >
          Delete category
        </button>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete category?"
          message={`“${category?.name}”'s transactions become uncategorized.`}
          busy={busy}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={remove}
        />
      )}
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
